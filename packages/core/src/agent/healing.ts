/**
 * The built-in self-healing stack — one composable {@link Middleware} per behavior, plus
 * {@link defaults} that bundles them in the right order. An agent installs {@link defaults} unless its
 * `healing` field overrides it (`false`/`[]` for a raw loop, or an explicit array to pick/configure), so
 * healing is batteries-included yet fully pluggable: adding or swapping a behavior is a middleware change,
 * never loop surgery. Each healing behavior acts only through the public middleware seam — reading
 * outcomes and emitting the same replayable events (`tool.repair`, `tool.retry`, `loop.detected`,
 * `object.invalid`) the loop has always produced — so a user's own healing composes identically.
 *
 * Crash-hardening (a throwing provider/middleware/tool degrading to a typed `run.error` instead of taking
 * the run down) is deliberately NOT part of this stack: it is a safety invariant wired into the loop and
 * is never disabled, even with `healing: false`.
 *
 * @packageDocumentation
 */
import {
  classifiedError,
  type JsonValue,
  type Middleware,
  repairJson,
  type ToolErrorClass,
  toolErrorClass,
} from "../protocol/index.ts";

// The single coercion argRepair attempts: a whole args object emitted by the model as a JSON string.
// Deterministic and narrow — only a string that repair-parses to an object/array is coerced.
function coerceArgs(input: JsonValue): JsonValue | undefined {
  if (typeof input !== "string") return undefined;
  const parsed = repairJson(input);
  return parsed !== null && typeof parsed === "object" ? parsed : undefined;
}

// ── harmony / leaked-tool-call salvage (used by harmonyRepair) ────────────────────────────────────
// Some gateways surface a model's tool call as ordinary assistant TEXT (the model's native tool grammar
// leaks through the OpenAI-compat `content` channel instead of being parsed into `tool_calls`). These
// helpers recover such a call from the text so the loop can still execute it.

// The literal sentinels that mark a leaked tool call. Presence of any is the trigger to attempt salvage.
const TOOL_MARKERS = ["<|channel|>", "to=functions.", "to=", "<tool_call>", "<|tool_call|>", "<|tool_call_start|>"] as const;

// Extract the first balanced {...} JSON object at/after `from`, respecting strings/escapes. Undefined if none.
function balancedObject(s: string, from: number): string | undefined {
  const start = s.indexOf("{", from);
  if (start === -1) return undefined;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return s.slice(start, i + 1);
  }
  return undefined;
}

// A repaired object payload, or {} when nothing usable parses (fail-soft: an argless call still fires).
function objectOrEmpty(json: string | undefined): JsonValue {
  if (json === undefined) return {};
  const parsed = repairJson(json);
  return parsed !== null && typeof parsed === "object" ? parsed : {};
}

interface SalvagedCall {
  readonly name: string;
  readonly input: JsonValue;
}

/**
 * Recover tool calls that leaked into assistant text. Only names present in `known` are accepted, so a
 * plain-prose answer that merely mentions a tool name is never mis-salvaged. Handles the OpenAI "harmony"
 * channel grammar (`… to=functions.NAME … <|message|>{json}`) and explicit `<tool_call>{…}</tool_call>`
 * blocks (Hermes/Qwen) that arrived as content.
 */
function salvageToolCalls(text: string, known: ReadonlySet<string>): SalvagedCall[] {
  const out: SalvagedCall[] = [];
  // 1. Harmony: a routing marker `to=[functions.]NAME` followed by the args after the next `<|message|>`.
  const routeRe = /to=(?:functions\.)?([A-Za-z_]\w*)/g;
  for (let m = routeRe.exec(text); m !== null; m = routeRe.exec(text)) {
    const name = m[1];
    if (name === undefined || !known.has(name)) continue;
    const msgIdx = text.indexOf("<|message|>", m.index);
    const from = msgIdx !== -1 ? msgIdx + "<|message|>".length : routeRe.lastIndex;
    out.push({ name, input: objectOrEmpty(balancedObject(text, from)) });
  }
  if (out.length > 0) return out;
  // 2. Explicit <tool_call>…</tool_call> JSON blocks ({ "name", "arguments" }) that leaked as content.
  if (text.includes("<tool_call>")) {
    const blockRe = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
    for (let m = blockRe.exec(text); m !== null; m = blockRe.exec(text)) {
      const parsed = repairJson(m[1] ?? "");
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) continue;
      const obj = parsed as { readonly [k: string]: JsonValue };
      const name = obj["name"];
      if (typeof name !== "string" || !known.has(name)) continue;
      out.push({ name, input: obj["arguments"] ?? obj["parameters"] ?? {} });
    }
  }
  return out;
}

// Strip leaked tool-call markup from the assistant text so the transcript's assistant turn stays clean:
// keep only any prose before the earliest sentinel.
function stripToolMarkup(text: string): string {
  let cut = text.length;
  for (const marker of TOOL_MARKERS) {
    const i = text.indexOf(marker);
    if (i !== -1 && i < cut) cut = i;
  }
  return text.slice(0, cut).trim();
}


// Render a schema-issue list (as carried on a FinalizeOutcome) back into a "; "-joined message string.
function issueText(issues: JsonValue): string {
  if (!Array.isArray(issues)) return String(issues);
  return issues
    .map((i) => (i !== null && typeof i === "object" && !Array.isArray(i) && "message" in i ? String((i as { message: unknown }).message) : String(i)))
    .join("; ");
}

/**
 * Tool-altitude repair: when a tool call fails schema validation because the model emitted the whole
 * arguments object as a JSON string (a common small-model slip), coerce it to the object, emit a visible
 * `tool.repair`, and re-run the call once. Any non-`invalid_args` failure, or an uncoercible input, is
 * left untouched for the model to see.
 *
 * @typeParam Deps - the agent's dependency bag (inferred; healing middleware are dependency-agnostic).
 */
export function argRepair<Deps = unknown>(): Middleware<Deps> {
  return {
    name: "healing.argRepair",
    async tool(ctx, call, next) {
      const out = await next(call);
      if (out.status === "ok") return out;
      if (toolErrorClass(out.error) !== "invalid_args") return out;
      const coerced = coerceArgs(call.input);
      if (coerced === undefined) return out;
      ctx.emit({ type: "tool.repair", callId: call.callId, name: call.name, mechanism: "coerce", before: call.input, after: coerced });
      return next({ ...call, input: coerced });
    },
  };
}

/**
 * Model-altitude salvage: when the provider parsed NO tool calls but the model's text contains a leaked
 * tool call (its native tool grammar surfaced through the OpenAI-compat `content` channel instead of
 * `tool_calls` — e.g. gpt-oss "harmony" markers, or a stray `<tool_call>…</tool_call>` block), recover the
 * call, emit a visible `tool.repair` (`mechanism: "parse"`), and hand it back so the loop executes it. Only
 * names the agent actually exposes are salvaged, so a prose answer that merely mentions a tool is untouched.
 *
 * @typeParam Deps - the agent's dependency bag (inferred; healing middleware are dependency-agnostic).
 */
export function harmonyRepair<Deps = unknown>(): Middleware<Deps> {
  return {
    name: "healing.harmonyRepair",
    async model(ctx, call, next) {
      const result = await next(call);
      // Nothing to do when the provider already parsed calls, there are no tools, or no marker is present.
      if (result.calls.length > 0 || call.tools.length === 0) return result;
      if (!TOOL_MARKERS.some((m) => result.text.includes(m))) return result;
      const known = new Set(call.tools.map((t) => t.name));
      const salvaged = salvageToolCalls(result.text, known);
      if (salvaged.length === 0) return result;
      const calls = salvaged.map((s) => ({ callId: ctx.runtime.randomUUID(), name: s.name, input: s.input }));
      for (const c of calls) {
        ctx.emit({ type: "tool.repair", callId: c.callId, name: c.name, mechanism: "parse", before: result.text, after: c.input });
      }
      return { ...result, text: stripToolMarkup(result.text), finishReason: "tool_calls", calls };
    },
  };
}

/** Options for {@link retryBudget}. */
export interface RetryBudgetOptions {
  /** Consecutive-failure budget per tool before the run ends with a `TOOL_REPAIR_EXHAUSTED` error. Default 2. */
  readonly max?: number;
}

/**
 * Step-altitude repair budget: a tool that keeps failing is re-asked (each failure emits `tool.retry`)
 * until it exhausts `max` consecutive failures with no success in between, at which point the run halts
 * with a clear `ToolRepairExhausted` terminal error instead of burning to `maxSteps`. Any success resets
 * that tool's counter.
 *
 * @param opts - see {@link RetryBudgetOptions}. `max` defaults to 2; `max: 0` gives up on the first failure.
 */
export function retryBudget<Deps = unknown>(opts: RetryBudgetOptions = {}): Middleware<Deps> {
  const max = opts.max ?? 2;
  return {
    name: "healing.retryBudget",
    async step(ctx, input, next) {
      const out = await next(input);
      if (ctx.halted || out.toolOutcomes === undefined) return out;
      const counts = ctx.scope("healing.retryBudget", () => new Map<string, number>());
      for (const o of out.toolOutcomes) {
        if (o.ok) {
          counts.delete(o.name);
          continue;
        }
        const n = (counts.get(o.name) ?? 0) + 1;
        counts.set(o.name, n);
        const cls: ToolErrorClass = o.error !== undefined ? (toolErrorClass(o.error) ?? "handler_error") : "handler_error";
        if (n > max) {
          const last = o.error?.message ?? "unknown error";
          ctx.halt(
            classifiedError(
              "ToolRepairExhausted",
              `Tool "${o.name}" failed ${n} times in a row without succeeding (last error: ${last}). Raise the retry budget, fix the tool/schema, or add examples.`,
              cls,
              { code: "TOOL_REPAIR_EXHAUSTED" },
            ),
          );
          return out;
        }
        ctx.emit({ type: "tool.retry", callId: o.callId, name: o.name, attempt: n, errorClass: cls });
      }
      return out;
    },
  };
}

/** Options for {@link loopGuard}. */
export interface LoopGuardOptions {
  /** Identical-call count at which the model is steered once with a nudge. Default 3. */
  readonly steerAt?: number;
  /** Identical-call count at which the run halts with a `LoopDetected` error. Default 4. */
  readonly haltAt?: number;
}

/**
 * Step-altitude no-progress guard: over identical `(tool, canonical-args)` signatures, the model is
 * steered once at `steerAt` (a `loop.detected` with `action: "steer"` plus an injected nudge), then the
 * run halts at `haltAt` with a typed `LoopDetected` error (`action: "halt"`). Catches the residual case of
 * identical calls that don't (or no longer) error — repeated *failing* calls are bounded by
 * {@link retryBudget} first.
 *
 * @param opts - see {@link LoopGuardOptions}. `steerAt` defaults to 3, `haltAt` to 4.
 */
export function loopGuard<Deps = unknown>(opts: LoopGuardOptions = {}): Middleware<Deps> {
  const steerAt = opts.steerAt ?? 3;
  const haltAt = opts.haltAt ?? 4;
  return {
    name: "healing.loopGuard",
    async step(ctx, input, next) {
      const out = await next(input);
      if (ctx.halted || out.toolOutcomes === undefined) return out;
      const sigs = ctx.scope("healing.loopGuard", () => new Map<string, number>());
      for (const o of out.toolOutcomes) {
        const sig = `${o.name}:${JSON.stringify(o.input)}`;
        const seen = (sigs.get(sig) ?? 0) + 1;
        sigs.set(sig, seen);
        if (seen >= haltAt) {
          ctx.emit({ type: "loop.detected", signature: sig, count: seen, action: "halt" });
          ctx.halt({
            name: "LoopDetected",
            message: `Loop detected: "${o.name}" was called with identical arguments ${seen} times without progress. Halting.`,
            data: { code: "LOOP_DETECTED" },
          });
          return out;
        }
        if (seen === steerAt) {
          ctx.emit({ type: "loop.detected", signature: sig, count: seen, action: "steer" });
          ctx.steer(
            `You have called "${o.name}" with identical arguments ${seen} times, which is not making progress. Try different arguments, a different tool, or give your final answer.`,
          );
        }
      }
      return out;
    },
  };
}

/** Options for {@link outputRetry}. */
export interface OutputRetryOptions {
  /** Re-ask budget when structured output fails schema validation. Default 2. */
  readonly max?: number;
}

/**
 * Finalize-altitude structured-output retry: when the model's final text fails the `output` schema, emit a
 * visible `object.invalid`, then either re-ask (steer the model with the failing issues plus the schema
 * hint) up to `max` times, or halt with a typed `OutputInvalid` error once the budget is spent. Only runs
 * for agents that declare an `output` schema.
 *
 * @param opts - see {@link OutputRetryOptions}. `max` defaults to 2.
 */
export function outputRetry<Deps = unknown>(opts: OutputRetryOptions = {}): Middleware<Deps> {
  const max = opts.max ?? 2;
  return {
    name: "healing.outputRetry",
    async finalize(ctx, call, next) {
      const out = await next(call);
      if (out.status === "ok") return out;
      const st = ctx.scope("healing.outputRetry", () => ({ attempt: 0 }));
      ctx.emit({ type: "object.invalid", attempt: st.attempt, issues: out.issues });
      if (st.attempt >= max) {
        ctx.halt({ name: "OutputInvalid", message: `structured output failed validation after ${st.attempt + 1} attempts` });
        return out;
      }
      st.attempt++;
      ctx.steer(`Your previous response did not match the schema: ${issueText(out.issues)}. Reply with ONLY a valid JSON object.${call.retryHint}`);
      return out;
    },
  };
}

/**
 * The default self-healing stack, installed by every agent unless its `healing` field overrides it. Order
 * matters: `argRepair` (tool) and `outputRetry` (finalize) act during a step, while `retryBudget` runs its
 * budget check before `loopGuard`'s no-progress check so an exhausted tool halts before loop detection fires.
 *
 * @typeParam Deps - the agent's dependency bag (inferred).
 */
export function defaults<Deps = unknown>(): readonly Middleware<Deps>[] {
  return [harmonyRepair<Deps>(), argRepair<Deps>(), loopGuard<Deps>(), retryBudget<Deps>(), outputRetry<Deps>()];
}

/**
 * The built-in self-healing middleware, as a namespace. Spread {@link healing.defaults} (the agent default)
 * or pick individual behaviors into an agent's `healing` field / a plugin's `use`.
 *
 * @example
 * ```ts
 * import { agent, healing } from "@mithril/core/agent";
 *
 * // raw loop except a stricter loop guard:
 * agent({ model, instructions, tools, healing: [healing.loopGuard({ haltAt: 3 })] });
 * ```
 */
export const healing = { argRepair, harmonyRepair, retryBudget, loopGuard, outputRetry, defaults } as const;
