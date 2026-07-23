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
  return [argRepair<Deps>(), loopGuard<Deps>(), retryBudget<Deps>(), outputRetry<Deps>()];
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
export const healing = { argRepair, retryBudget, loopGuard, outputRetry, defaults } as const;
