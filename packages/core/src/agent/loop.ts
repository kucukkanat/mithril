import {
  addUsage,
  type AnyTool,
  type ApprovalDecision,
  type ChatRequest,
  classifiedError,
  type EventConsumer,
  type EventMeta,
  type FinishReason,
  isSuspend,
  type JsonValue,
  type Middleware,
  type MiddlewareContext,
  type MithrilEvent,
  type ModelCall,
  type ModelInput,
  type ModelResult,
  type ProviderChunk,
  type ProviderRegistry,
  repairJson,
  type RunContext,
  type RuntimeAdapter,
  type SerializedError,
  type SpanRef,
  type StandardSchemaV1,
  type StepInput,
  type StepOutcome,
  type SuspensionDescriptor,
  type SuspensionRequest,
  type ToolErrorClass,
  toolErrorClass,
  type ToolInvocation,
  type ToolOutcome,
  type Transport,
  type UsageDelta,
  type UsageTotals,
  ZERO_USAGE,
} from "../protocol/index.ts";
import { type Input, inputToJson, type RunResult, toSerializedError } from "./agent-types.ts";
import { globalConsumers } from "./global-consumers.ts";
import { MithrilError, resolveModel, resolveTransport } from "./registry.ts";
import { defaultRuntime } from "./runtime.ts";

const ZERO_DELTA: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };
const APPROVAL_SCHEMA_ID = "mithril.approval";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type EventBody = DistributiveOmit<MithrilEvent, keyof EventMeta>;

interface Call {
  readonly callId: string;
  readonly name: string;
  readonly input: JsonValue;
}
interface LoopMessage {
  readonly role: string;
  readonly content: string;
  readonly toolCalls: readonly Call[];
}

/** How a run paused, so {@link agentLoop} can dispatch the right resume behavior. */
export type PendingKind = "approval" | "return" | "midtool";

/**
 * The serialized description of what a suspended run is waiting on — enough to resume it in another
 * process. `approval` (Tier-1) resumes with an {@link ApprovalDecision}; `return` (Tier-1b, a tool
 * returned `suspend(...)`) and `midtool` (Tier-2, `ctx.suspend()`) resume with a resolution value.
 */
export interface PendingSuspension {
  readonly kind: PendingKind;
  readonly callId: string;
  readonly descriptor: SuspensionDescriptor;
  /** Tier-2 only: journaled effect values recorded before the pause, replayed on resume. */
  readonly journal?: Readonly<Record<string, JsonValue>>;
  /** Tier-2 only: resolutions consumed by prior `ctx.suspend()` calls, replayed in order on resume. */
  readonly resolutions?: readonly JsonValue[];
}

/** The value supplied to resume a suspended run: an approval decision, or an arbitrary resolution value. */
export type ResumeValue = ApprovalDecision<JsonValue> | { readonly kind: "resolve"; readonly value: JsonValue };

/** The reconstructed loop state driving a resume, assembled by {@link agent} from a run token. */
export interface ResumeState {
  readonly messages: readonly LoopMessage[];
  readonly usage: UsageTotals;
  readonly step: number;
  readonly pending: PendingSuspension;
  readonly resolution: ResumeValue;
}

/** The versioned, serializable run token carried by a `suspended` {@link RunResult}. */
export interface RunTokenV2 {
  readonly v: 2;
  readonly runId: string;
  readonly model: string;
  readonly messages: readonly LoopMessage[];
  readonly usage: UsageTotals;
  readonly step: number;
  readonly pending: PendingSuspension;
}

// The internal directive applied to the first pending tool call on resume. `approve`/`reject`/`edit` are the
// Tier-1 approval arms; `return` feeds a Tier-1b resolution as the tool result; `midtool` re-runs the tool's
// execute with the recorded journal + resolutions (Tier-2 replay).
type Directive =
  | ApprovalDecision<JsonValue>
  | { readonly kind: "return"; readonly value: JsonValue }
  | { readonly kind: "midtool"; readonly journal: Readonly<Record<string, JsonValue>>; readonly resolutions: readonly JsonValue[]; readonly value: JsonValue };

// Internal unwinding signal for ctx.suspend() (Tier-2) and a tool-returned suspend marker (Tier-1b). Never
// escapes the loop: runToolCalls catches it and turns it into a serializable PendingSuspension. A unique
// class (not a plain Error) so overly-broad user `catch` blocks are less likely to swallow it silently.
class SuspendSignal {
  constructor(
    readonly kind: "return" | "midtool",
    readonly request: SuspensionRequest,
    readonly journal: Readonly<Record<string, JsonValue>>,
    readonly resolutions: readonly JsonValue[],
  ) {}
}

// Mutable per-execution replay state. Fresh runs start empty; a Tier-2 resume seeds journal + priorResolutions.
interface ExecState {
  journal: Record<string, JsonValue>;
  readonly priorResolutions: readonly JsonValue[];
  ordinal: number;
}

/**
 * The full set of inputs to {@link agentLoop} — the flattened, already-resolved form of an
 * {@link AgentConfig} plus per-run options.
 *
 * @typeParam Deps - the dependency object injected into tool/instruction contexts.
 * @remarks This is the loop's low-level contract: {@link agent} assembles it from config + `RunOptions`.
 * `transport`/`providers`/`runtime` omitted fall back to environment BYOK, the model handle's provider,
 * and {@link defaultRuntime} respectively. `resume` drives the cross-process resume path; `output` +
 * `outputRetries` drive structured output. `maxSteps` defaults to 16, `outputRetries` to 2.
 */
export interface LoopOptions<Deps> {
  readonly model: ModelInput;
  readonly instructions: string | ((ctx: RunContext<Deps>) => string | Promise<string>);
  readonly tools: readonly AnyTool<Deps>[];
  readonly input: Input;
  readonly deps: Deps;
  readonly transport?: Transport;
  readonly providers?: ProviderRegistry;
  readonly runtime?: RuntimeAdapter;
  readonly signal?: AbortSignal;
  readonly maxSteps?: number;
  readonly runId?: string;
  readonly resume?: ResumeState;
  readonly output?: StandardSchemaV1<unknown, JsonValue>;
  readonly outputRetries?: number;
  readonly toolRetries?: number;
  readonly loopDetection?: boolean;
  readonly maxTokens?: number;
  readonly maxCostMicroUsd?: number;
  readonly repair?: boolean;
  readonly selfCorrection?: boolean;
  readonly middlewares?: readonly Middleware<Deps>[];
  readonly consumers?: readonly EventConsumer[];
}

const OUTPUT_HINT = "\n\nRespond with ONLY a single JSON object that matches the required schema.";

function issuesToJson(issues: readonly { readonly message: string }[]): JsonValue {
  return issues.map((i) => ({ message: i.message }));
}

function reqToDescriptor(req: SuspensionRequest, callId: string): SuspensionDescriptor {
  return {
    kind: req.kind,
    callId,
    payload: req.payload,
    ...(req.resolutionSchemaId !== undefined ? { resolutionSchemaId: req.resolutionSchemaId } : {}),
  };
}

// Best-effort "partial JSON": close any open strings/objects/arrays so an in-progress structured response
// parses into a deep-partial object for `object.delta` streaming.
function tryPartialJson(s: string): JsonValue | undefined {
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (const ch of s) {
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  let out = inStr ? `${s}"` : s;
  out = out.replace(/,\s*$/, "").replace(/:\s*$/, ": null");
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i];
  try {
    return JSON.parse(out) as JsonValue;
  } catch {
    return undefined;
  }
}

function isAsyncGen(v: unknown): v is AsyncGenerator<{ readonly payload: JsonValue }, unknown> {
  return typeof v === "object" && v !== null && Symbol.asyncIterator in v;
}

// Validate tool-call input against its schema, with one bounded, VISIBLE coercion before giving up: a
// JSON-encoded string of the real arguments (a common small-model slip). A successful coercion fires
// `onCoerce` (→ a `tool.repair` event); an unrepairable input throws INVALID_TOOL_INPUT with the issues.
async function resolveInput(
  schema: StandardSchemaV1<unknown, unknown>,
  input: JsonValue,
  repair: boolean,
  onCoerce: (before: JsonValue, after: JsonValue) => void,
): Promise<JsonValue> {
  const first = await schema["~standard"].validate(input);
  if (first.issues === undefined) return first.value as JsonValue;
  if (repair) {
    const coerced = coerceArgs(input);
    if (coerced !== undefined) {
      const second = await schema["~standard"].validate(coerced);
      if (second.issues === undefined) {
        onCoerce(input, coerced);
        return second.value as JsonValue;
      }
    }
  }
  throw new MithrilError("INVALID_TOOL_INPUT", `invalid tool input: ${first.issues.map((i) => i.message).join("; ")}`);
}

// The single coercion we attempt: a whole args object emitted as a JSON string. Deterministic and narrow —
// only a string that repair-parses to an object/array is coerced; anything else is left to fail validation.
function coerceArgs(input: JsonValue): JsonValue | undefined {
  if (typeof input !== "string") return undefined;
  const parsed = repairJson(input);
  return parsed !== null && typeof parsed === "object" ? parsed : undefined;
}

// A per-call summary surfaced from runToolCalls so the step can drive the per-tool repair budget.
interface ToolCallSummary {
  readonly callId: string;
  readonly name: string;
  readonly ok: boolean;
  readonly error?: SerializedError;
}

// Surface a tool's `examples` into its wire description (few-shot exemplars are the strongest prompt-side
// lift for small models). Applied once at the model boundary so every provider benefits. Returns the same
// array untouched when no tool declares examples.
function withExamples(tools: readonly AnyTool<unknown>[]): readonly AnyTool<unknown>[] {
  let changed = false;
  const out = tools.map((t) => {
    const ex = t.examples;
    if (ex === undefined || ex.length === 0) return t;
    changed = true;
    const block = ex.map((e) => `- ${JSON.stringify(e)}`).join("\n");
    return { ...t, description: `${t.description}\n\nExample calls:\n${block}` };
  });
  return changed ? out : tools;
}

// Per-run guard state, threaded through every step so budgets and loop detection persist across steps.
interface StepGuards {
  readonly repairCounts: Map<string, number>; // toolName -> consecutive failures (per-tool repair budget)
  readonly maxToolRetries: number;
  readonly loopSigs: Map<string, number>; // (tool, canonical-args) signature -> times seen (loop detection)
  readonly loopDetection: boolean;
}

// Loop-detection thresholds over identical (tool, canonical-args) signatures: nudge once, then halt.
const LOOP_STEER_AT = 3;
const LOOP_HALT_AT = 4;

// Boundary-checked token/cost budgets. Returns the first breached budget, or undefined when under budget.
function checkBudget(
  usage: UsageTotals,
  opts: { readonly maxTokens?: number; readonly maxCostMicroUsd?: number },
): { readonly budget: "tokens" | "cost"; readonly limit: number; readonly actual: number } | undefined {
  if (opts.maxTokens !== undefined) {
    const used = usage.input + usage.output;
    if (used > opts.maxTokens) return { budget: "tokens", limit: opts.maxTokens, actual: used };
  }
  if (opts.maxCostMicroUsd !== undefined && usage.costMicroUsd > opts.maxCostMicroUsd) {
    return { budget: "cost", limit: opts.maxCostMicroUsd, actual: usage.costMicroUsd };
  }
  return undefined;
}

// Classify a caught tool-execution failure onto the ToolErrorClass taxonomy so `tool.error` carries a
// machine-readable class (routes repair and targeted re-ask). A schema-validation MithrilError is
// `invalid_args` (retryable — the model can produce different args); anything else a handler bug.
function classifyToolError(err: unknown): SerializedError {
  if (err instanceof MithrilError) {
    const cls: ToolErrorClass =
      err.code === "INVALID_TOOL_INPUT" ? "invalid_args" : err.code === "INVALID_TOOL_OUTPUT" ? "invalid_output" : "handler_error";
    return classifiedError(err.name, err.message, cls, { code: err.code, ...(cls === "invalid_args" ? { retryable: true } : {}) });
  }
  const message = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : "Error";
  return classifiedError(name, message, "handler_error");
}

// Remaining tool calls of the last assistant turn that have not yet produced a tool result. The first is
// the one awaiting approval/resolution; a token serializes enough to recompute this on resume.
function pendingCalls(messages: readonly LoopMessage[]): readonly Call[] {
  let ai = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m !== undefined && m.role === "assistant" && m.toolCalls.length > 0) {
      ai = i;
      break;
    }
  }
  if (ai < 0) return [];
  const assistant = messages[ai];
  if (assistant === undefined) return [];
  const executed = messages.slice(ai + 1).filter((m) => m.role === "tool").length;
  return assistant.toolCalls.slice(executed);
}

/**
 * The core streaming agent loop: drives model turns and tool execution, emitting {@link MithrilEvent}s and
 * returning a terminal {@link RunResult}.
 *
 * @typeParam Deps - the dependency object injected into tool/instruction contexts.
 * @param opts - the resolved {@link LoopOptions}.
 * @returns an `AsyncGenerator` that yields every run event and finally returns the {@link RunResult}. The
 * result's `output` is typed as `JsonValue` here; {@link agent} narrows it to the config's `Out`.
 * @throws {@link MithrilError} on unresolvable model/provider or invalid tool input (`INVALID_TOOL_INPUT`).
 * @remarks Each iteration is one step (bounded by `maxSteps`, default 16). A step calls the model, streams
 * its chunks, then either finishes (text or validated structured output), runs the requested tool calls, or
 * suspends. Three suspension tiers are wired: Tier-1 approval (`needsApproval`), Tier-1b (a tool returns
 * `suspend(...)`), and Tier-2 (`ctx.suspend()` mid-execute, resumed by replaying journaled effects).
 * Middleware wraps both the model call and each tool invocation. Consumers see every stamped event.
 * Aborting `opts.signal` returns a `"cancelled"` result at the next step boundary.
 * @example
 * ```ts
 * import { agentLoop } from "@mithril/core/agent";
 *
 * const gen = agentLoop({
 *   model: myModelHandle,
 *   instructions: "Be brief.",
 *   tools: [],
 *   input: "Hello",
 *   deps: undefined,
 * });
 * for (;;) {
 *   const next = await gen.next();
 *   if (next.done) {
 *     console.log("result:", next.value);
 *     break;
 *   }
 *   console.log("event:", next.value.type);
 * }
 * ```
 */
export async function* agentLoop<Deps>(opts: LoopOptions<Deps>): AsyncGenerator<MithrilEvent, RunResult<JsonValue>> {
  const rt = opts.runtime ?? defaultRuntime();
  const signal = opts.signal ?? new AbortController().signal;
  const { id: modelId, provider } = resolveModel(opts.model, opts.providers);
  const transport = resolveTransport(opts.transport, modelId);

  const runId = opts.runId ?? rt.randomUUID();
  const traceId = rt.randomUUID();
  const rootSpan: SpanRef = { id: rt.randomUUID(), parentId: null, traceId, kind: "invoke_agent" };
  let seq = 0;
  let usage: UsageTotals = ZERO_USAGE;
  const messages: LoopMessage[] = [];
  // §9.2 — run-scoped consumers plus any process-wide ones (zero-touch devtools attach).
  const consumers = [...(opts.consumers ?? []), ...globalConsumers()];
  const middlewares = opts.middlewares ?? [];
  // Self-correction toggles. `selfCorrection` is the master (default on); each feature flag overrides it for
  // its one behavior. Crash-hardening is intentionally NOT gated — a throwing provider/middleware always
  // degrades to a typed error, never a crash, regardless of these flags.
  const selfCorrect = opts.selfCorrection ?? true;
  const repairEnabled = opts.repair ?? selfCorrect;

  function stamp(span: SpanRef, body: EventBody): MithrilEvent {
    const e = { v: 1, runId, seq: seq++, ts: rt.now(), span, ...body } as MithrilEvent;
    for (const c of consumers) c.onEvent(e); // §3.8 consumers see every event (pure subscribers)
    return e;
  }
  // Context for instructions/needsApproval predicates: no tool-execution replay state (suspend/journal are
  // inert here — an instruction function that suspends is not a supported shape).
  const makeCtx = (step: number, span: SpanRef, emitted: MithrilEvent[]): RunContext<Deps> => ({
    deps: opts.deps,
    runId,
    step,
    signal,
    usage,
    runtime: rt,
    emit(payload, type) {
      emitted.push(stamp(span, { type: type ?? "custom.emit", payload }));
    },
    suspend() {
      return Promise.reject(new MithrilError("NOT_IMPLEMENTED", "ctx.suspend() is only available inside a tool's execute()."));
    },
    journal(_key, fn) {
      return fn();
    },
  });
  // Context for a tool's execute(): suspend()/journal() are wired to the replay state so Tier-2 works.
  const makeExecCtx = (step: number, span: SpanRef, emitted: MithrilEvent[], exec: ExecState): RunContext<Deps> => ({
    deps: opts.deps,
    runId,
    step,
    signal,
    usage,
    runtime: rt,
    emit(payload, type) {
      emitted.push(stamp(span, { type: type ?? "custom.emit", payload }));
    },
    async suspend<Req extends SuspensionRequest>(req: Req) {
      const ord = exec.ordinal++;
      if (ord < exec.priorResolutions.length) return exec.priorResolutions[ord] as never;
      throw new SuspendSignal("midtool", req, exec.journal, exec.priorResolutions);
    },
    async journal(key, fn) {
      if (Object.hasOwn(exec.journal, key)) return exec.journal[key] as never;
      const v = await fn();
      exec.journal[key] = v as JsonValue; // journaled values must be JSON-safe (validated by the optional schema)
      return v;
    },
  });
  const makeMwContext = (step: number, span: SpanRef, emitted: MithrilEvent[]): MiddlewareContext<Deps> => ({
    deps: opts.deps,
    runId,
    step,
    signal,
    runtime: rt,
    journal: (_key, fn) => fn(),
    emit: (e) => {
      emitted.push(stamp(span, { type: e.type, payload: e.payload }));
    },
  });

  const serialize = (step: number, pending: PendingSuspension): string => {
    const token: RunTokenV2 = { v: 2, runId, model: modelId, messages, usage, step, pending };
    return JSON.stringify(token);
  };
  const suspendedResult = (pending: PendingSuspension, step: number): RunResult<JsonValue> => ({
    status: "suspended",
    request: pending.descriptor,
    token: serialize(step, pending),
  });

  // Execute a list of tool calls in order. Yields events; returns a PendingSuspension when a call pauses
  // (approval, Tier-1b return, or Tier-2 mid-tool). `firstDirective` applies to calls[0] only (the resumed one).
  async function* runToolCalls(
    calls: readonly Call[],
    firstDirective: Directive | undefined,
    chatSpan: SpanRef,
    step: number,
  ): AsyncGenerator<MithrilEvent, { readonly suspend?: PendingSuspension; readonly outcomes: readonly ToolCallSummary[] }> {
    const outcomes: ToolCallSummary[] = [];
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      if (call === undefined) continue;
      const directive = i === 0 ? firstDirective : undefined;
      const toolSpan: SpanRef = { id: rt.randomUUID(), parentId: chatSpan.id, traceId, kind: "execute_tool" };
      const tool = opts.tools.find((t) => t.name === call.name);
      if (tool === undefined) {
        const known = opts.tools.map((t) => t.name).join(", ");
        const error = classifiedError("UnknownTool", `No tool "${call.name}". Available tools: ${known}.`, "unknown_tool", { retryable: true });
        yield stamp(toolSpan, { type: "tool.error", callId: call.callId, error });
        messages.push({ role: "tool", content: `error: unknown tool ${call.name}. Available tools: ${known}.`, toolCalls: [] });
        outcomes.push({ callId: call.callId, name: call.name, ok: false, error });
        continue;
      }
      const emitted: MithrilEvent[] = [];

      // ── directive dispatch (calls[0] on resume) ──────────────────────────────────────────────────────
      if (directive === undefined) {
        // Fresh call: gate behind Tier-1 approval if requested.
        const na = tool.needsApproval;
        const ctx = makeCtx(step, toolSpan, emitted);
        const needs = na === undefined ? false : typeof na === "boolean" ? na : await na(call.input as never, ctx);
        for (const e of emitted) yield e;
        emitted.length = 0;
        if (needs) {
          yield stamp(toolSpan, { type: "tool.approval.requested", callId: call.callId, name: call.name, input: call.input });
          const descriptor: SuspensionDescriptor = {
            kind: "tool.approval",
            callId: call.callId,
            payload: { name: call.name, input: call.input },
            resolutionSchemaId: APPROVAL_SCHEMA_ID,
          };
          yield stamp(toolSpan, { type: "suspend", descriptor });
          return { suspend: { kind: "approval", callId: call.callId, descriptor }, outcomes };
        }
      } else if (directive.kind === "reject") {
        const output: JsonValue = { approved: false, message: directive.message };
        yield stamp(toolSpan, { type: "tool.result", callId: call.callId, output, ms: 0 });
        messages.push({ role: "tool", content: JSON.stringify(output), toolCalls: [] });
        outcomes.push({ callId: call.callId, name: call.name, ok: true });
        continue;
      } else if (directive.kind === "return") {
        // Tier-1b: the tool already produced a suspend marker; the resolution IS its result. Do not re-run.
        yield stamp(toolSpan, { type: "tool.result", callId: call.callId, output: directive.value, ms: 0 });
        messages.push({ role: "tool", content: JSON.stringify(directive.value), toolCalls: [] });
        outcomes.push({ callId: call.callId, name: call.name, ok: true });
        continue;
      }

      // ── execution (fresh, approved/edited, or Tier-2 replay) ─────────────────────────────────────────
      const exec: ExecState =
        directive?.kind === "midtool"
          ? { journal: { ...directive.journal }, priorResolutions: [...directive.resolutions, directive.value], ordinal: 0 }
          : { journal: {}, priorResolutions: [], ordinal: 0 };
      const rawInput = directive?.kind === "edit" ? directive.input : call.input;
      const started = rt.now();
      const ctx = makeExecCtx(step, toolSpan, emitted, exec);
      const mwCtx = makeMwContext(step, toolSpan, emitted);
      // Core execution as a ToolOutcome; middleware (tool altitude) wraps it and may short-circuit. A
      // suspension (Tier-1b marker or Tier-2 ctx.suspend) unwinds as a SuspendSignal caught below.
      const runCore = async (inv: ToolInvocation): Promise<ToolOutcome> => {
        try {
          const parsed = await resolveInput(tool.inputSchema, inv.input, repairEnabled, (before, after) => {
            emitted.push(stamp(toolSpan, { type: "tool.repair", callId: inv.callId, name: inv.name, mechanism: "coerce", before, after }));
          });
          const raw = await runExecute(tool, parsed, ctx, (payload) => {
            emitted.push(stamp(toolSpan, { type: "tool.progress", callId: inv.callId, payload }));
          });
          if (isSuspend(raw)) throw new SuspendSignal("return", raw.request, {}, []);
          const output = raw as JsonValue;
          // A declared outputSchema is now enforced (previously trusted as-is): a violating tool result is a
          // classified tool.error the model sees, catching a silent-bug class (and MCP structuredContent drift).
          if (tool.outputSchema !== undefined) {
            const checked = await tool.outputSchema["~standard"].validate(output);
            if (checked.issues !== undefined) {
              throw new MithrilError(
                "INVALID_TOOL_OUTPUT",
                `tool "${inv.name}" returned output that failed its outputSchema: ${checked.issues.map((i) => i.message).join("; ")}`,
              );
            }
          }
          return { callId: inv.callId, status: "ok", output };
        } catch (err) {
          if (err instanceof SuspendSignal) throw err;
          return { callId: inv.callId, status: "error", error: classifyToolError(err) };
        }
      };
      const chain = middlewares.reduceRight<(inv: ToolInvocation) => Promise<ToolOutcome>>((next, mw) => {
        const wrap = mw.tool;
        return wrap === undefined ? next : (inv) => wrap(mwCtx, inv, next);
      }, runCore);
      const invocation: ToolInvocation = {
        callId: call.callId,
        name: call.name,
        input: rawInput,
        ...(tool.version !== undefined ? { version: tool.version } : {}),
      };
      let outcome: ToolOutcome;
      try {
        outcome = await chain(invocation);
      } catch (err) {
        if (err instanceof SuspendSignal) {
          for (const e of emitted) yield e; // flush any progress/custom events emitted before the pause
          const descriptor = reqToDescriptor(err.request, call.callId);
          yield stamp(toolSpan, { type: "suspend", descriptor });
          const pending: PendingSuspension =
            err.kind === "midtool"
              ? { kind: "midtool", callId: call.callId, descriptor, journal: err.journal, resolutions: err.resolutions }
              : { kind: "return", callId: call.callId, descriptor };
          return { suspend: pending, outcomes };
        }
        // A tool-altitude middleware threw (not a suspension). Degrade to a model-visible tool.error
        // rather than crashing the whole run — a buggy guardrail must not take the run down with it.
        outcome = { callId: call.callId, status: "error", error: classifyToolError(err) };
      }
      for (const e of emitted) yield e;
      if (outcome.status === "ok") {
        yield stamp(toolSpan, { type: "tool.result", callId: call.callId, output: outcome.output, ms: rt.now() - started });
        messages.push({ role: "tool", content: JSON.stringify(outcome.output), toolCalls: [] });
        outcomes.push({ callId: call.callId, name: call.name, ok: true });
      } else {
        yield stamp(toolSpan, { type: "tool.error", callId: call.callId, error: outcome.error });
        messages.push({ role: "tool", content: JSON.stringify({ error: outcome.error.message }), toolCalls: [] });
        outcomes.push({ callId: call.callId, name: call.name, ok: false, error: outcome.error });
      }
    }
    return { outcomes };
  }

  // ── entry: fresh vs resume ────────────────────────────────────────────────────────────────────────
  if (opts.resume === undefined) {
    if (typeof opts.input === "string") messages.push({ role: "user", content: opts.input, toolCalls: [] });
    else for (const m of opts.input) messages.push({ role: m.role, content: m.content, toolCalls: [] });
    const preCtx = makeCtx(-1, rootSpan, []);
    const instructions = typeof opts.instructions === "string" ? opts.instructions : await opts.instructions(preCtx);
    yield stamp(rootSpan, { type: "run.start", input: inputToJson(opts.input), model: modelId, depsDigest: "" });
    return yield* stepLoop(instructions, 0);
  }

  // ── resume path ───────────────────────────────────────────────────────────────────────────────────
  const resume = opts.resume;
  for (const m of resume.messages) messages.push({ ...m });
  usage = resume.usage;
  const remaining = pendingCalls(messages);
  if (remaining.length === 0 || remaining[0]?.callId !== resume.pending.callId) {
    return { status: "unresumable", request: resume.pending.descriptor, reason: "no matching pending tool call in token" };
  }
  const preCtx = makeCtx(-1, rootSpan, []);
  const instructions = typeof opts.instructions === "string" ? opts.instructions : await opts.instructions(preCtx);
  const resumeSpan: SpanRef = { id: rt.randomUUID(), parentId: rootSpan.id, traceId, kind: "chat" };
  const directive = resumeDirective(resume);
  const resolutionValue: JsonValue = "value" in directive ? directive.value : (directive as JsonValue);
  yield stamp(rootSpan, { type: "resume", resolutionFor: resume.pending.callId, value: resolutionValue });
  const outcome = yield* runToolCalls(remaining, directive, resumeSpan, resume.step);
  if (outcome.suspend !== undefined) return suspendedResult(outcome.suspend, resume.step);
  yield stamp(resumeSpan, { type: "step.finish", step: resume.step, stop: "tool", usage: ZERO_DELTA });
  return yield* stepLoop(instructions, resume.step + 1);

  // Run one step (model call + tool execution) fully, buffering its events into `sink` and returning a
  // structured next-action. The step altitude wraps this whole unit; the model altitude wraps the model call
  // inside it; the tool altitude wraps each tool. `attempt` (structured-output retries) is threaded by ref.
  type StepNext =
    | { readonly kind: "continue" }
    | { readonly kind: "retry" }
    | { readonly kind: "terminal"; readonly result: RunResult<JsonValue>; readonly reason: FinishReason }
    | { readonly kind: "suspend"; readonly pending: PendingSuspension };
  async function runStep(
    step: number,
    instructions: string,
    chatSpan: SpanRef,
    sink: MithrilEvent[],
    attemptRef: { attempt: number },
    maxRetries: number,
    guards: StepGuards,
    setNext: (n: StepNext) => void,
  ): Promise<StepOutcome> {
    sink.push(stamp(chatSpan, { type: "step.start", step }));
    const system = opts.output !== undefined ? instructions + OUTPUT_HINT : instructions;

    // The model call as a middleware-wrappable unit: streams the provider into the sink + aggregates a
    // ModelResult. Model-altitude middleware can wrap it — retry, cache, or short-circuit.
    const mwCtx = makeMwContext(step, chatSpan, sink);
    const coreModel = async (call: ModelCall): Promise<ModelResult> => {
      const req: ChatRequest = {
        model: call.model,
        system: call.system,
        messages: call.messages,
        tools: withExamples(call.tools),
        ...(opts.output !== undefined ? { output: opts.output } : {}),
      };
      let text = "";
      let lastPartial = "";
      const calls: Call[] = [];
      let stepUsage: UsageDelta = ZERO_DELTA;
      let finishReason: FinishReason = "stop";
      // A provider throwing mid-stream (network drop, unparseable frame) must not crash the run: wrap it as
      // a retryable PROVIDER_ERROR. A pending abort is rethrown untouched so the loop reports "cancelled".
      try {
        for await (const chunk of provider.chat(req, rt, transport, signal)) {
          sink.push(stampChunk(stamp, chatSpan, chunk));
          if (chunk.type === "text.delta") {
            text += chunk.delta;
            if (opts.output !== undefined) {
              const partial = tryPartialJson(text);
              if (partial !== undefined) {
                const key = JSON.stringify(partial);
                if (key !== lastPartial) {
                  lastPartial = key;
                  sink.push(stamp(chatSpan, { type: "object.delta", partial }));
                }
              }
            }
          } else if (chunk.type === "tool.call") calls.push({ callId: chunk.callId, name: chunk.name, input: chunk.input });
          else if (chunk.type === "message.end") {
            stepUsage = chunk.usage;
            finishReason = chunk.finishReason;
          }
        }
      } catch (err) {
        if (signal.aborted || err instanceof MithrilError) throw err;
        throw new MithrilError("PROVIDER_ERROR", `Model provider "${modelId}" failed mid-stream: ${err instanceof Error ? err.message : String(err)}`);
      }
      return { text, finishReason, usage: stepUsage, calls };
    };
    const modelChain = middlewares.reduceRight<(c: ModelCall) => Promise<ModelResult>>((next, mw) => {
      const wrap = mw.model;
      return wrap === undefined ? next : (c) => wrap(mwCtx, c, next);
    }, coreModel);

    const result = await modelChain({ model: modelId, system, messages, tools: opts.tools as readonly AnyTool<unknown>[] });
    const calls: Call[] = [...result.calls];
    usage = { ...addUsage(usage, result.usage), steps: usage.steps + 1 };
    messages.push({ role: "assistant", content: result.text, toolCalls: calls });

    if (calls.length === 0) {
      // Structured output: parse the final text as JSON, validate against the schema, retry on failure.
      if (opts.output !== undefined) {
        let value: unknown;
        try {
          value = JSON.parse(result.text);
        } catch {
          value = result.text;
        }
        const validated = await opts.output["~standard"].validate(value);
        if (validated.issues === undefined) {
          sink.push(stamp(chatSpan, { type: "object.final", value: validated.value }));
          sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "output", usage: result.usage }));
          setNext({ kind: "terminal", result: { status: "completed", output: validated.value, usage }, reason: result.finishReason });
          return { step, stop: "output", usage: result.usage };
        }
        sink.push(stamp(chatSpan, { type: "object.invalid", attempt: attemptRef.attempt, issues: issuesToJson(validated.issues) }));
        sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "output", usage: result.usage }));
        if (attemptRef.attempt >= maxRetries) {
          setNext({
            kind: "terminal",
            result: { status: "error", error: { name: "OutputInvalid", message: `structured output failed validation after ${attemptRef.attempt + 1} attempts` }, usage },
            reason: "error",
          });
          return { step, stop: "error", usage: result.usage };
        }
        attemptRef.attempt++;
        messages.push({
          role: "user",
          content: `Your previous response did not match the schema: ${validated.issues.map((i) => i.message).join("; ")}. Reply with ONLY a valid JSON object.`,
          toolCalls: [],
        });
        setNext({ kind: "retry" });
        return { step, stop: "output", usage: result.usage };
      }
      sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "text", usage: result.usage }));
      setNext({ kind: "terminal", result: { status: "completed", output: result.text, usage }, reason: result.finishReason });
      return { step, stop: "text", usage: result.usage };
    }

    // Tools: drain the runToolCalls generator into the sink; a suspension short-circuits the step.
    const toolGen = runToolCalls(calls, undefined, chatSpan, step);
    let toolResult: { readonly suspend?: PendingSuspension; readonly outcomes: readonly ToolCallSummary[] } = { outcomes: [] };
    for (;;) {
      const r = await toolGen.next();
      if (r.done) {
        toolResult = r.value;
        break;
      }
      sink.push(r.value);
    }
    if (toolResult.suspend !== undefined) {
      setNext({ kind: "suspend", pending: toolResult.suspend });
      return { step, stop: "suspend", usage: result.usage };
    }
    // Per-tool repair budget: a tool that keeps failing is re-asked (each failure emits `tool.retry`) until
    // it exhausts `maxToolRetries` consecutive failures, at which point the run ends with a clear terminal
    // error instead of burning to maxSteps. Any success resets that tool's counter.
    for (const o of toolResult.outcomes) {
      if (o.ok) {
        guards.repairCounts.delete(o.name);
        continue;
      }
      const n = (guards.repairCounts.get(o.name) ?? 0) + 1;
      guards.repairCounts.set(o.name, n);
      const cls: ToolErrorClass = o.error !== undefined ? (toolErrorClass(o.error) ?? "handler_error") : "handler_error";
      if (n > guards.maxToolRetries) {
        const last = o.error?.message ?? "unknown error";
        const error = classifiedError(
          "ToolRepairExhausted",
          `Tool "${o.name}" failed ${n} times in a row without succeeding (last error: ${last}). Raise toolRetries, fix the tool/schema, or add examples.`,
          cls,
          { code: "TOOL_REPAIR_EXHAUSTED" },
        );
        sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "error", usage: result.usage }));
        setNext({ kind: "terminal", result: { status: "error", error, usage }, reason: "error" });
        return { step, stop: "error", usage: result.usage };
      }
      // With an unbounded budget (selfCorrection off) there is no attempt count to report — stay quiet and
      // let the raw loop feed the tool.error back, bounded only by maxSteps.
      if (Number.isFinite(guards.maxToolRetries)) {
        sink.push(stamp(chatSpan, { type: "tool.retry", callId: o.callId, name: o.name, attempt: n, errorClass: cls }));
      }
    }
    // Loop / no-progress detection over identical (tool, canonical-args) signatures: nudge the model once,
    // then halt with a clear terminal error. Repeated FAILING calls are already bounded by the repair budget
    // above; this catches the residual case of identical calls that don't (or no longer) error.
    if (guards.loopDetection) {
      for (const c of calls) {
        const sig = `${c.name}:${JSON.stringify(c.input)}`;
        const seen = (guards.loopSigs.get(sig) ?? 0) + 1;
        guards.loopSigs.set(sig, seen);
        if (seen >= LOOP_HALT_AT) {
          sink.push(stamp(chatSpan, { type: "loop.detected", signature: sig, count: seen, action: "halt" }));
          sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "error", usage: result.usage }));
          const error: SerializedError = {
            name: "LoopDetected",
            message: `Loop detected: "${c.name}" was called with identical arguments ${seen} times without progress. Halting.`,
            data: { code: "LOOP_DETECTED" },
          };
          setNext({ kind: "terminal", result: { status: "error", error, usage }, reason: "error" });
          return { step, stop: "error", usage: result.usage };
        }
        if (seen === LOOP_STEER_AT) {
          sink.push(stamp(chatSpan, { type: "loop.detected", signature: sig, count: seen, action: "steer" }));
          messages.push({
            role: "user",
            content: `You have called "${c.name}" with identical arguments ${seen} times, which is not making progress. Try different arguments, a different tool, or give your final answer.`,
            toolCalls: [],
          });
        }
      }
    }
    sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "tool", usage: result.usage }));
    setNext({ kind: "continue" });
    return { step, stop: "tool", usage: result.usage };
  }

  // ── the step loop, shared by fresh + resume ─────────────────────────────────────────────────────────
  async function* stepLoop(instructions: string, from: number): AsyncGenerator<MithrilEvent, RunResult<JsonValue>> {
    const maxSteps = opts.maxSteps ?? 16;
    const maxRetries = opts.outputRetries ?? 2;
    const attemptRef = { attempt: 0 };
    const guards: StepGuards = {
      repairCounts: new Map<string, number>(),
      maxToolRetries: opts.toolRetries ?? (selfCorrect ? 2 : Number.POSITIVE_INFINITY),
      loopSigs: new Map<string, number>(),
      loopDetection: opts.loopDetection ?? selfCorrect,
    };
    for (let step = from; step < maxSteps; step++) {
      if (signal.aborted) {
        // Surface a caller-supplied abort reason (handle.cancel(reason) / AbortController.abort(reason));
        // a bare abort leaves signal.reason a DOMException, so fall back to the generic label.
        const reason = typeof signal.reason === "string" ? signal.reason : "aborted";
        yield stamp(rootSpan, { type: "run.cancel", reason });
        return { status: "cancelled", usage };
      }
      // Boundary-checked token/cost budgets: a run that has already spent past its budget stops here with a
      // clear, typed terminal error rather than starting another step.
      const over = checkBudget(usage, opts);
      if (over !== undefined) {
        yield stamp(rootSpan, { type: "budget.exceeded", budget: over.budget, limit: over.limit, actual: over.actual });
        yield stamp(rootSpan, { type: "run.finish", reason: "length", usage });
        return {
          status: "error",
          error: {
            name: "BudgetExceeded",
            message: `Run exceeded its ${over.budget} budget (${over.actual} > ${over.limit}). Raise the limit or reduce the work.`,
            data: { code: "BUDGET_EXCEEDED" },
          },
          usage,
        };
      }
      const chatSpan: SpanRef = { id: rt.randomUUID(), parentId: rootSpan.id, traceId, kind: "chat" };
      const sink: MithrilEvent[] = [];
      // A holder (not a bare local) so control-flow analysis keeps the full StepNext union across the closure
      // mutation. `next` stays "continue" when a step middleware short-circuits without running the step.
      const holder: { next: StepNext } = { next: { kind: "continue" } };
      const setNext = (n: StepNext): void => {
        holder.next = n;
      };
      const stepCtx = makeMwContext(step, chatSpan, sink);
      const stepChain = middlewares.reduceRight<(i: StepInput) => Promise<StepOutcome>>((run, mw) => {
        const wrap = mw.step;
        return wrap === undefined ? run : (i) => wrap(stepCtx, i, run);
      }, (i) => runStep(i.step, instructions, chatSpan, sink, attemptRef, maxRetries, guards, setNext));

      try {
        await stepChain({ step, messages });
      } catch (err) {
        for (const e of sink) yield e; // flush whatever the step emitted before it threw
        if (signal.aborted) {
          const reason = typeof signal.reason === "string" ? signal.reason : "aborted";
          yield stamp(rootSpan, { type: "run.cancel", reason });
          return { status: "cancelled", usage };
        }
        // A model/step-altitude middleware or the provider threw and nothing downstream handled it. Surface
        // a typed run.error on the stream plus a terminal error result, rather than crashing the run.
        const error = toSerializedError(err);
        yield stamp(rootSpan, { type: "run.error", error });
        return { status: "error", error, usage };
      }
      for (const e of sink) yield e;

      const next = holder.next;
      if (next.kind === "suspend") return suspendedResult(next.pending, step);
      if (next.kind === "terminal") {
        yield stamp(rootSpan, { type: "run.finish", reason: next.reason, usage });
        return next.result;
      }
      // "retry" and "continue" both advance to the next step.
    }
    // The step budget was exhausted without a terminal step. Returning `completed` here would hand back an
    // empty `output` indistinguishable from a real answer (and type-unsound for a structured-output agent),
    // so this is an explicit, actionable error the caller must handle.
    yield stamp(rootSpan, { type: "run.finish", reason: "length", usage });
    return {
      status: "error",
      error: {
        name: "MaxStepsExceeded",
        message: `Run hit its ${maxSteps}-step budget (maxSteps) before finishing. Raise maxSteps, or check for a tool/model loop.`,
      },
      usage,
    };
  }
}

// Map the caller-supplied ResumeValue + the token's pending kind onto the internal first-call Directive.
function resumeDirective(resume: ResumeState): Directive {
  const { pending, resolution } = resume;
  if (pending.kind === "approval") {
    if (resolution.kind === "resolve") {
      throw new MithrilError("BAD_RESOLUTION", "This suspension expects an ApprovalDecision (approve/reject/edit), not a resolve value.");
    }
    return resolution;
  }
  if (resolution.kind !== "resolve") {
    throw new MithrilError("BAD_RESOLUTION", "This suspension expects a resolve value ({ kind: 'resolve', value }), not an ApprovalDecision.");
  }
  if (pending.kind === "return") return { kind: "return", value: resolution.value };
  return { kind: "midtool", journal: pending.journal ?? {}, resolutions: pending.resolutions ?? [], value: resolution.value };
}

async function runExecute<Deps>(
  tool: AnyTool<Deps>,
  input: JsonValue,
  ctx: RunContext<Deps>,
  onProgress: (payload: JsonValue) => void,
): Promise<unknown> {
  const ret = tool.execute(input as never, ctx);
  if (isAsyncGen(ret)) {
    const it = ret[Symbol.asyncIterator]();
    for (;;) {
      const r = await it.next();
      if (r.done) return r.value;
      onProgress(r.value.payload);
    }
  }
  return await ret;
}

function stampChunk(stamp: (span: SpanRef, body: EventBody) => MithrilEvent, span: SpanRef, chunk: ProviderChunk): MithrilEvent {
  switch (chunk.type) {
    case "text.delta":
      return stamp(span, { type: "text.delta", delta: chunk.delta });
    case "reasoning.delta":
      return stamp(span, { type: "reasoning.delta", delta: chunk.delta });
    case "tool.input.delta":
      return stamp(span, { type: "tool.input.delta", callId: chunk.callId, name: chunk.name, partial: chunk.partial });
    case "tool.call":
      return stamp(span, { type: "tool.call", callId: chunk.callId, name: chunk.name, input: chunk.input });
    case "object.delta":
      return stamp(span, { type: "object.delta", partial: chunk.partial });
    case "message.end":
      return stamp(span, { type: "message.end", role: "assistant", usage: chunk.usage });
  }
}
