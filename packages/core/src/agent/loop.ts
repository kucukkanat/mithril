import {
  addUsage,
  type AnyTool,
  type ApprovalDecision,
  type ChatRequest,
  type CheckpointRecord,
  classifiedError,
  type ContentPart,
  type EventConsumer,
  type EventMeta,
  type FinalizeCall,
  type FinalizeOutcome,
  type FinishReason,
  isSuspend,
  type JsonValue,
  normalizeContent,
  type JsonSchemaConverter,
  type Middleware,
  type MiddlewareContext,
  type MithrilEvent,
  type ModelCall,
  type ModelInput,
  type ModelResult,
  type Persistence,
  type PluginHost,
  type PluginSetup,
  type ProviderChunk,
  type ProviderRegistry,
  type RunToolRegistry,
  PERMISSIVE_OBJECT,
  extractJson,
  repairPartialJson,
  toJsonSchema,
  type RunContext,
  type RuntimeAdapter,
  type SerializedError,
  type SpanRef,
  type StandardSchemaV1,
  type StepInput,
  type StepOutcome,
  type SuspensionDescriptor,
  type SuspensionRequest,
  type ToolDefinition,
  type ToolErrorClass,
  type ToolInvocation,
  type ToolOutcome,
  type ToolProvenance,
  type ToolRegistry,
  type ToolStepOutcome,
  type Transport,
  type UsageDelta,
  type UsageTotals,
  ZERO_USAGE,
} from "../protocol/index.ts";
import { type Input, inputToJson, type RunResult, toSerializedError } from "./agent-types.ts";
import { globalConsumers } from "./global-consumers.ts";
import { healing as healingStack } from "./healing.ts";
import { MithrilError, resolveModel, resolveTransport } from "./registry.ts";
import { defaultRuntime } from "./runtime.ts";
import { toolRegistry } from "./tool-registry.ts";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTERNAL FUNCTION INDEX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// § Output formatting
//   • buildOutputHint() — format JSON schema as compact prompt hint
//   • tryPartialJson() — parse in-progress structured output
//   • issuesToJson() — convert validation issues to JSON
//
// § Suspension & HITL routing
//   • reqToDescriptor() — serialize a suspension request
//   • resumeDirective() — determine resume action type (approve/reject/return/midtool)
//
// § Tool execution & streaming
//   • runExecute() — invoke tool with journal replay and stream handling
//   • withExamples() — attach few-shot examples to tool descriptions
//   • classifyToolError() — categorize tool errors for self-correction
//   • isAsyncGen() — check if tool result is an async generator
//
// § Budget & state management
//   • checkBudget() — validate token/cost limits
//   • pendingCalls() — extract unfinalized tool calls from message history
//   • resolveInput() — validate input against schema
//
// § Entry point
//   • agentLoop() — the main async generator (line 317)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// TYPE CONVENTIONS & INTERNAL TYPES
// • Deps — the dependency injection object threaded through tool/instruction contexts
// • Directive — union of suspension resume paths (approval, tool return, mid-execution replay)
// • ExecState — mutable per-execution state tracking journal + prior resolutions
// • SuspendSignal — internal unwinding signal (never escapes the loop)

const ZERO_DELTA: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };
const APPROVAL_SCHEMA_ID = "mithril.approval";
/** Default cap on tool calls executed concurrently within a single step (see `maxConcurrentTools`). */
const DEFAULT_TOOL_CONCURRENCY = 8;

// Run `fn(0..count-1)` with at most `limit` in flight at once — a bounded worker pool that dispatches indices
// in order. Workers pull the next index and await `fn`, so slow calls never block ready ones. Used to execute
// a step's independent tool calls concurrently (results are still committed in call order by the caller).
async function forEachConcurrent(count: number, limit: number, fn: (i: number) => Promise<void>): Promise<void> {
  if (count <= 0) return;
  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const i = next++;
      if (i >= count) return;
      await fn(i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), count) }, () => worker()));
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type EventBody = DistributiveOmit<MithrilEvent, keyof EventMeta>;

interface Call {
  readonly callId: string;
  readonly name: string;
  readonly input: JsonValue;
}
interface LoopMessage {
  readonly role: string;
  readonly content: string | readonly ContentPart[];
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
  /** Tools the suspended run had created; rebuilt via `LoopOptions.materialize`. See {@link RunTokenV3}. */
  readonly tools?: readonly ToolDefinition[];
}

/**
 * The versioned, serializable run token carried by a `suspended` {@link RunResult}.
 *
 * @remarks Still exported so an older stored token can be read; {@link RunTokenV3} is what the loop emits.
 */
export interface RunTokenV2 {
  readonly v: 2;
  readonly runId: string;
  readonly model: string;
  readonly messages: readonly LoopMessage[];
  readonly usage: UsageTotals;
  readonly step: number;
  readonly pending: PendingSuspension;
}

/**
 * The current run token: {@link RunTokenV2} plus the tools the run created.
 *
 * @remarks
 * The definitions ride the token *as well as* the `tool.registered` events, and both are needed. The
 * events are what let `replay(log)` reconstruct the registry; the token is what lets `resume()` work in a
 * process that never saw the log — the loop is handed only the token string on that path. Neither alone
 * covers both cases, and the duplication is one JSON record per authored tool.
 */
export interface RunTokenV3 {
  readonly v: 3;
  readonly runId: string;
  readonly model: string;
  readonly messages: readonly LoopMessage[];
  readonly usage: UsageTotals;
  readonly step: number;
  readonly pending: PendingSuspension;
  /** Every non-static tool the run held at suspend time, in registration order. */
  readonly tools?: readonly ToolDefinition[];
}

// Tier-1 HITL resumption: approval/rejection/edit decision from human (ApprovalDecision is from protocol).
type ApprovalDirective = ApprovalDecision<JsonValue>;

// Tier-1b resumption: tool returned suspend(...), continue with this value as tool result.
type ToolReturnDirective = { readonly kind: "return"; readonly value: JsonValue };

// Tier-2 resumption: ctx.suspend() paused mid-execution; replay journal + resolutions, then resume with value.
type MidtoolDirective = {
  readonly kind: "midtool";
  readonly journal: Readonly<Record<string, JsonValue>>;
  readonly resolutions: readonly JsonValue[];
  readonly value: JsonValue;
};

// The internal directive applied to the first pending tool call on resume.
// Combines Tier-1 (approval), Tier-1b (tool return), and Tier-2 (mid-execution) resumption paths.
type Directive = ApprovalDirective | ToolReturnDirective | MidtoolDirective;

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
 * and {@link defaultRuntime} respectively. `resume` drives the cross-process resume path; `output` drives
 * structured output; `healing` selects the self-correction stack. `maxSteps` defaults to 16.
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
  /** Opt-in durable persistence; present ⇒ {@link agentLoop} auto-checkpoints the run (terminal + suspend). */
  readonly persistence?: Persistence;
  readonly output?: StandardSchemaV1<unknown, JsonValue>;
  readonly outputSchema?: JsonSchemaConverter;
  readonly maxTokens?: number;
  readonly maxCostMicroUsd?: number;
  /**
   * Max tool calls executed concurrently within one step (default {@link DEFAULT_TOOL_CONCURRENCY}). A model
   * that requests several independent tool calls in a turn runs them in a bounded pool instead of serially;
   * `1` restores strict sequential execution. Results still commit in call order, so the event stream and
   * message history are deterministic regardless of completion order.
   */
  readonly maxConcurrentTools?: number;
  /**
   * The self-healing stack. Omitted ⇒ the batteries-included default ({@link healing.defaults}); `false`
   * or `[]` ⇒ a raw loop (crash-hardening still on); an array ⇒ exactly those healing middleware. Composed
   * ahead of `middlewares` so healing wraps user middleware.
   */
  readonly healing?: false | readonly Middleware<Deps>[];
  readonly middlewares?: readonly Middleware<Deps>[];
  readonly consumers?: readonly EventConsumer[];
  /**
   * Plugin `setup` hooks, run sequentially in `use` order once per run before step 0 (and again on
   * resume). `tools` is the registry's seed; a setup adds to it.
   */
  readonly setups?: readonly PluginSetup<Deps>[];
  /**
   * Rebuilds a runtime tool from its {@link ToolDefinition} when resuming. Supplied by whichever plugin
   * owns the definition `body` format; core never interprets a body itself.
   */
  readonly materialize?: (def: ToolDefinition) => AnyTool<Deps>;
}

const OUTPUT_HINT = "\n\nRespond with ONLY a single JSON object that matches the required schema.";

// Render a compact, prompt-friendly description of the required output shape from the schema's JSON Schema.
// Small models produce far more valid structured output when the field names/types are IN the prompt (they
// otherwise guess key names). Provider-agnostic: it shapes the system prompt for every model, and coexists
// with any native constrained-decoding a provider adds. Falls back to the bare hint when the schema can't be
// described (no converter + not self-describing ⇒ PERMISSIVE_OBJECT), so it never emits a useless `{}`.
function buildOutputHint(schema: StandardSchemaV1<unknown, JsonValue>, convert?: JsonSchemaConverter): string {
  const doc = toJsonSchema(schema, convert);
  if (doc === PERMISSIVE_OBJECT) return OUTPUT_HINT;
  return `${OUTPUT_HINT}\n\nThe JSON object must conform to this JSON Schema:\n${JSON.stringify(doc)}`;
}

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
// parses into a deep-partial object for `object.delta` streaming. Delegates to the shared repairPartialJson
// so the streaming closer, the terminal extractor, and tool-call parsing share one lenient parser.
function tryPartialJson(s: string): JsonValue | undefined {
  return repairPartialJson(s);
}

function isAsyncGen(v: unknown): v is AsyncGenerator<{ readonly payload: JsonValue }, unknown> {
  return typeof v === "object" && v !== null && Symbol.asyncIterator in v;
}

// Validate tool-call input against its schema. Strict: an invalid input throws INVALID_TOOL_INPUT with the
// issues. Deterministic argument coercion (a JSON-string of the args) is no longer done here — it lives in
// the `healing.argRepair` middleware, which catches the invalid_args failure and re-runs with coerced args.
async function resolveInput(schema: StandardSchemaV1<unknown, unknown>, input: JsonValue): Promise<JsonValue> {
  const first = await schema["~standard"].validate(input);
  if (first.issues === undefined) return first.value as JsonValue;
  throw new MithrilError("INVALID_TOOL_INPUT", `invalid tool input: ${first.issues.map((i) => i.message).join("; ")}`);
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
      err.code === "INVALID_TOOL_INPUT"
        ? "invalid_args"
        : err.code === "INVALID_TOOL_OUTPUT"
          ? "invalid_output"
          : err.code === "TOOL_TIMEOUT"
            ? "timeout"
            : "handler_error";
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
 * Aborting `opts.signal` returns a `"cancelled"` result at the next step boundary. When `opts.persistence`
 * is supplied, the run's terminal or suspended outcome is checkpointed automatically before this returns.
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
  const p = opts.persistence;
  // No persistence ⇒ the loop is a pure event producer, zero overhead and unchanged behavior.
  if (p === undefined) return yield* runCore<Deps>(opts);
  // Persistence ⇒ pin a stable runId (opts.runId wins, then persistence.runId, else fresh) so the loop and
  // the checkpoint agree, drive the run, then chain a checkpoint recording its terminal/suspended outcome.
  const rt = opts.runtime ?? defaultRuntime();
  const runId = opts.runId ?? p.runId ?? rt.randomUUID();
  const result = yield* runCore<Deps>({ ...opts, runId });
  await persistResult(p, runId, result, rt);
  return result;
}

// Crockford's base32 (no I/L/O/U) — the ULID alphabet used for `getRandomValues`-derived checkpoint ids.
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// A time-ordered, insecure-context-safe checkpoint id: a 10-char millisecond timestamp prefix plus 80 bits
// of `getRandomValues` randomness (16 chars), in Crockford base32 — a ULID, sortable by creation time.
function ulid(rt: RuntimeAdapter): string {
  let t = rt.now();
  const time = new Array<string>(10);
  for (let i = 9; i >= 0; i--) {
    time[i] = CROCKFORD[t % 32] ?? "0";
    t = Math.floor(t / 32);
  }
  const bytes = rt.getRandomValues(new Uint8Array(10));
  let out = "";
  let bits = 0;
  let value = 0;
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += CROCKFORD[(value >> bits) & 31];
      value &= (1 << bits) - 1; // keep `value` bounded so the shifts stay inside JS's 32-bit bitwise range
    }
  }
  return time.join("") + out;
}

// Chain a checkpoint recording the run's outcome. A suspended run stores its (optionally sealed) resumable
// token + pending descriptor; terminal states store a null token. `ifParent` chains onto the latest record;
// a rare optimistic-concurrency conflict (a concurrent writer on the same runId) is retried a few times.
async function persistResult(p: Persistence, runId: string, result: RunResult<JsonValue>, rt: RuntimeAdapter): Promise<void> {
  const rawToken = result.status === "suspended" ? result.token : null;
  const token = rawToken !== null && p.seal !== undefined ? await p.seal(rawToken) : rawToken;
  const pending = result.status === "suspended" ? result.request : undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    const latest = await p.checkpointer.latest(runId);
    const parentId = latest?.checkpointId ?? null;
    const rec: CheckpointRecord = {
      runId,
      checkpointId: ulid(rt),
      parentId,
      token,
      status: result.status,
      createdAt: new Date(rt.now()).toISOString(),
      ...(pending !== undefined ? { pending } : {}),
    };
    if ((await p.checkpointer.put(rec, { ifParent: parentId })) === "ok") return;
  }
  throw new MithrilError("CHECKPOINT_CONFLICT", `Failed to persist a checkpoint for run "${runId}" after repeated concurrency conflicts.`);
}

async function* runCore<Deps>(opts: LoopOptions<Deps>): AsyncGenerator<MithrilEvent, RunResult<JsonValue>> {
  const rt = opts.runtime ?? defaultRuntime();
  const signal = opts.signal ?? new AbortController().signal;
  const { id: modelId, provider } = resolveModel(opts.model, opts.providers);
  const transport = resolveTransport(opts.transport, modelId);

  const runId = opts.runId ?? rt.randomUUID();
  // The run's live tool set, seeded with the statically declared tools. Always fresh per run — a shared
  // registry would break run isolation and make replay non-reproducible.
  const registry = toolRegistry<Deps>(opts.tools);
  // Names claimed by an in-flight `ctx.tools.register()` whose call has not committed. Reserving at
  // register() time is what lets a tool learn about a collision *synchronously* (it can catch and rename)
  // while the mutation itself still lands atomically at commit — and it is why the commit-time
  // `registry.register` below cannot collide.
  const reservedNames = new Set<string>();
  const traceId = rt.randomUUID();
  const rootSpan: SpanRef = { id: rt.randomUUID(), parentId: null, traceId, kind: "invoke_agent" };
  let seq = 0;
  let usage: UsageTotals = ZERO_USAGE;
  const messages: LoopMessage[] = [];
  // §9.2 — run-scoped consumers plus any process-wide ones (zero-touch devtools attach).
  const consumers = [...(opts.consumers ?? []), ...globalConsumers()];
  // The self-healing stack is just middleware, composed ahead of any user middleware so healing wraps it.
  // `healing` omitted ⇒ the batteries-included default; `false`/`[]` ⇒ a raw loop. Crash-hardening is NOT
  // part of this stack — a throwing provider/middleware/tool always degrades to a typed error, never a crash.
  const healingStackMw = opts.healing === undefined ? healingStack.defaults<Deps>() : opts.healing === false ? [] : opts.healing;
  const middlewares = [...healingStackMw, ...(opts.middlewares ?? [])];
  // Run-scoped middleware control state (see makeMwContext): a per-run store for healing counters, a
  // one-shot terminal-error latch set by ctx.halt(), and a per-step flag set by ctx.steer().
  const mwStore = new Map<string, unknown>();
  let haltError: SerializedError | undefined;
  let steerPending = false;
  // Structured-output prompt hint, computed once per run: the bare instruction plus the schema shape when it
  // can be described (see buildOutputHint). Empty when the run has no output schema.
  const outputHint = opts.output !== undefined ? buildOutputHint(opts.output, opts.outputSchema) : "";

  function stamp(span: SpanRef, body: EventBody): MithrilEvent {
    const e = { v: 1, runId, seq: seq++, ts: rt.now(), span, ...body } as MithrilEvent;
    for (const c of consumers) c.onEvent(e); // §3.8 consumers see every event (pure subscribers)
    return e;
  }
  // The registry view for every context that is NOT a tool's execute(): reads pass through, writes reject.
  // Mutating from an instructions function or a needsApproval predicate has no call to commit against, so
  // there is no honest deferred-commit semantics to give it — mirroring how ctx.suspend() is treated here.
  const readOnlyTools = (where: string): RunToolRegistry<Deps> => ({
    summaries: () => registry.summaries(),
    has: (name) => registry.has(name),
    // Erasing Deps at the `get` boundary is what keeps RunContext covariant in Deps; see the @remarks on
    // RunToolRegistry.get. Safe: the loop only ever invokes these tools with this run's own RunContext<Deps>.
    get: (name) => registry.get(name) as AnyTool<unknown> | undefined,
    register() {
      throw new MithrilError("NOT_IMPLEMENTED", `ctx.tools.register() is only available inside a tool's execute() (called from ${where}).`);
    },
    revoke() {
      throw new MithrilError("NOT_IMPLEMENTED", `ctx.tools.revoke() is only available inside a tool's execute() (called from ${where}).`);
    },
  });

  // Context for instructions/needsApproval predicates: no tool-execution replay state (suspend/journal are
  // inert here — an instruction function that suspends is not a supported shape).
  const makeCtx = (step: number, span: SpanRef, emitted: MithrilEvent[]): RunContext<Deps> => ({
    deps: opts.deps,
    runId,
    step,
    signal,
    usage,
    reportUsage() {
      throw new MithrilError("NOT_IMPLEMENTED", "ctx.reportUsage() is only available inside a tool's execute().");
    },
    runtime: rt,
    transport,
    tools: readOnlyTools("an instructions function"),
    ...(opts.providers !== undefined ? { providers: opts.providers } : {}),
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
  const makeMwContext =(step: number, span: SpanRef, emitted: MithrilEvent[]): MiddlewareContext<Deps> => ({
    deps: opts.deps,
    runId,
    step,
    signal,
    runtime: rt,
    journal: (_key, fn) => fn(),
    emit: (e) => {
      emitted.push(stamp(span, e as EventBody));
    },
    steer: (message) => {
      messages.push({ role: "user", content: message, toolCalls: [] });
      steerPending = true;
    },
    halt: (error) => {
      if (haltError === undefined) haltError = error;
    },
    get halted() {
      return haltError !== undefined;
    },
    scope: <T>(key: string, init: () => T): T => {
      if (!mwStore.has(key)) mwStore.set(key, init());
      return mwStore.get(key) as T;
    },
  });

  // Run each plugin's `setup` once, sequentially in `use` order, after run.start and before step 0 — so the
  // first model call already sees every contributed tool. Sequential rather than concurrent because a later
  // plugin may legitimately build on an earlier one's tools, and that is the only ordering that is
  // explainable. A setup that throws fails the run: a plugin that could not install its capabilities has
  // not "partly" worked, and continuing would silently run an agent with fewer tools than its author declared.
  // Returns a terminal error result when a setup throws, rather than propagating: a throwing extension
  // degrades to a typed `run.error` on the stream, never a crash, exactly as at every other altitude.
  async function* runSetups(): AsyncGenerator<MithrilEvent, RunResult<JsonValue> | undefined> {
    for (const s of opts.setups ?? []) {
      if (signal.aborted) return undefined;
      const drafts: EventBody[] = [];
      let sealed = false;
      const checkOpen = (member: string): void => {
        if (sealed) {
          throw new MithrilError(
            "HOST_SEALED",
            `plugin "${s.plugin}" called host.${member} after its setup() resolved. The middleware chain and the ` +
              `step-0 tool snapshot are both built the moment setups finish, so later contributions would be silently lost.`,
          );
        }
      };
      // A registration carrying a ToolDefinition is logged; one without is not, and does not need to be —
      // `setup` is deterministic and re-runs on every resume, so its tools rebuild themselves. Only a
      // definition-carrying tool needs the log/token to come back.
      const hostTools: ToolRegistry<Deps> = {
        list: () => registry.list(),
        summaries: () => registry.summaries(),
        get: (name) => registry.get(name),
        has: (name) => registry.has(name),
        register: (t, provenance, definition) => {
          checkOpen("tools.register");
          const before = registry.revision;
          registry.register(t, provenance, definition);
          if (definition !== undefined && registry.revision !== before) {
            drafts.push({ type: "tool.registered", name: t.name, provenance, definition });
          }
        },
        revoke: (name) => {
          checkOpen("tools.revoke");
          const removed = registry.revoke(name);
          if (removed) drafts.push({ type: "tool.revoked", name, reason: "revoked" });
          return removed;
        },
        get revision() {
          return registry.revision;
        },
      };
      const host: PluginHost<Deps> = {
        tools: hostTools,
        deps: opts.deps,
        runId,
        runtime: rt,
        signal,
        register: (fragment) => {
          checkOpen("register");
          for (const t of fragment.tools ?? []) hostTools.register(t, { kind: "setup", plugin: s.plugin });
          // Middleware and consumers are appended to the live arrays; both are read after setups finish
          // (the chain is composed per step, `stamp` iterates consumers per event). A consumer added here
          // necessarily misses `run.start`, which has already been emitted.
          middlewares.push(...(fragment.middleware ?? []));
          consumers.push(...(fragment.consumers ?? []));
        },
        emit: (e) => {
          checkOpen("emit");
          drafts.push(e as EventBody);
        },
      };
      try {
        await s.run(host);
      } catch (err) {
        sealed = true;
        const error = toSerializedError(err);
        yield stamp(rootSpan, {
          type: "run.error",
          error: { ...error, message: `plugin "${s.plugin}" failed during setup: ${error.message}` },
        });
        return { status: "error", error, usage };
      }
      sealed = true;
      for (const body of drafts) yield stamp(rootSpan, body);
    }
    return undefined;
  }

  // Rebuild the tool set a suspended run held, from the definitions its token carried. Runs after setups,
  // and wins over them.
  async function* rehydrate(defs: readonly ToolDefinition[]): AsyncGenerator<MithrilEvent, void> {
    // Drop whatever the setups just installed from definitions — the token is authoritative.
    for (const s of registry.summaries()) {
      if (s.definition !== undefined) registry.revoke(s.name);
    }
    if (defs.length === 0) return;
    const materialize = opts.materialize;
    if (materialize === undefined) {
      // Failing loudly beats letting the model call a tool that silently no longer exists: `unknown_tool`
      // would send it hunting for a prompt bug that is really a missing plugin.
      throw new MithrilError(
        "NO_MATERIALIZER",
        `this run's token carries ${defs.length} runtime-defined tool(s) (${defs.map((d) => d.name).join(", ")}) but no plugin ` +
          `declares materialize(). Add the plugin that defined them to the agent's \`use\` array before resuming.`,
      );
    }
    for (const def of defs) {
      const provenance: ToolProvenance = { kind: "runtime", by: "resume", callId: "" };
      registry.register(materialize(def), provenance, def);
      yield stamp(rootSpan, { type: "tool.registered", name: def.name, provenance, definition: def });
    }
  }

  const serialize = (step: number, pending: PendingSuspension): string => {
    // Only definition-carrying entries are serialized. A tool a `setup` contributed without a definition
    // rebuilds itself when setups re-run on resume, so carrying it here would be dead weight.
    const created = registry
      .summaries()
      .filter((s) => s.definition !== undefined)
      .map((s) => s.definition as ToolDefinition);
    const token: RunTokenV3 = { v: 3, runId, model: modelId, messages, usage, step, pending, ...(created.length > 0 ? { tools: created } : {}) };
    return JSON.stringify(token);
  };
  const suspendedResult = (pending: PendingSuspension, step: number): RunResult<JsonValue> => ({
    status: "suspended",
    request: pending.descriptor,
    token: serialize(step, pending),
  });

  // Execute a turn's tool calls CONCURRENTLY (bounded by `maxConcurrentTools`), committing results in strict
  // call order so the event stream and message history stay deterministic regardless of completion order.
  // Yields events; returns a PendingSuspension when a call pauses. `firstDirective` applies to calls[0] only
  // (the resumed one). Suspension keeps sequential semantics: Tier-1 approval is a barrier resolved BEFORE any
  // execution (a gated call never speculatively runs later calls); a Tier-1b/Tier-2 mid-tool suspension forms
  // a second barrier — the earliest barrier wins, calls before it commit, the barrier call suspends. (A tool
  // that suspends mid-execution should journal its side effects: calls after it in the same turn re-run on
  // resume, and `ctx.journal` keeps that replay-safe.)
  async function* runToolCalls(
    calls: readonly Call[],
    firstDirective: Directive | undefined,
    chatSpan: SpanRef,
    step: number,
    stepTools: readonly AnyTool<Deps>[],
  ): AsyncGenerator<MithrilEvent, { readonly suspend?: PendingSuspension; readonly outcomes: readonly ToolStepOutcome[] }> {
    const outcomes: ToolStepOutcome[] = [];
    const concurrency = opts.maxConcurrentTools ?? DEFAULT_TOOL_CONCURRENCY;

    // A per-call settled unit: raw event BODIES (unstamped) to emit in call order at flush, plus either a
    // `commit` (append the tool message + record the outcome) or a `pending` suspension.
    interface Settled {
      readonly span: SpanRef;
      readonly events: readonly EventBody[];
      readonly commit?: () => void;
      readonly pending?: PendingSuspension;
    }
    // A plan produced WITHOUT executing the call: a fully-settled unit (unknown tool / reject / return), a
    // Tier-1 approval gate (known before execution), or an execution thunk.
    interface Plan {
      readonly span: SpanRef;
      readonly approval?: PendingSuspension;
      readonly approvalEvents?: readonly EventBody[];
      readonly settled?: Settled;
      readonly run?: () => Promise<Settled>;
    }

    // A queued registry mutation: the event to emit and the mutation to apply, both at commit. `name` is
    // kept so an abandoned call can release its reservation.
    interface RegistryOp {
      readonly name: string;
      readonly event: EventBody;
      readonly apply: () => void;
    }
    // Release the names an abandoned call had reserved. Called on the error and suspension paths — a call
    // that did not commit must leave no trace in the registry, including its reservations.
    const releaseOps = (ops: readonly RegistryOp[]): void => {
      for (const op of ops) reservedNames.delete(op.name);
    };

    // `ctx.tools` for a tool's execute(). Validates eagerly (so the tool gets a synchronous, catchable
    // error) but mutates lazily (so the change lands with the call's result, or not at all).
    const deferredTools = (ops: RegistryOp[], callId: string, toolName: string): RunToolRegistry<Deps> => ({
      summaries: () => registry.summaries(),
      has: (name) => registry.has(name) || reservedNames.has(name),
      get: (name) => registry.get(name) as AnyTool<unknown> | undefined,
      register(t, definition) {
        if (t.name !== definition.name) {
          throw new MithrilError("TOOL_NAME_MISMATCH", `tool.name "${t.name}" does not match definition.name "${definition.name}".`);
        }
        if (reservedNames.has(t.name)) {
          throw new MithrilError(
            "TOOL_NAME_TAKEN",
            `cannot register "${t.name}": another tool call in this step already claimed the name.`,
          );
        }
        // Probe the real registry now so a collision with a static/plugin tool surfaces here, where the
        // caller can catch it — not at commit, where nothing could handle it.
        const existing = registry.summaries().find((s) => s.name === t.name);
        if (existing !== undefined && existing.definition?.digest !== definition.digest) {
          throw new MithrilError(
            "TOOL_NAME_TAKEN",
            `cannot register "${t.name}": the name is already taken. Names are never shadowed — revoke it first, or choose another.`,
          );
        }
        reservedNames.add(t.name);
        const provenance: ToolProvenance = { kind: "runtime", by: toolName, callId };
        ops.push({
          name: t.name,
          event: { type: "tool.registered", name: t.name, provenance, definition, callId },
          apply: () => {
            reservedNames.delete(t.name);
            registry.register(t, provenance, definition);
          },
        });
      },
      revoke(name) {
        const entry = registry.summaries().find((s) => s.name === name);
        if (entry === undefined) return false;
        if (entry.provenance.kind === "static" || entry.provenance.kind === "plugin") {
          throw new MithrilError("TOOL_NOT_REVOCABLE", `cannot revoke "${name}": it was declared by the agent's author, not created by this run.`);
        }
        if (reservedNames.has(name)) return false; // already queued for removal by an earlier call this step
        reservedNames.add(name);
        ops.push({
          name,
          event: { type: "tool.revoked", name, reason: "revoked", callId },
          apply: () => {
            reservedNames.delete(name);
            registry.revoke(name);
          },
        });
        return true;
      },
    });

    // Raw-collecting contexts: they buffer event BODIES rather than stamping, so concurrent tools can still be
    // emitted in deterministic call order — the loop stamps (assigning seq + notifying consumers) at flush.
    const approvalContext = (sink: EventBody[]): RunContext<Deps> => ({
      deps: opts.deps,
      runId,
      step,
      signal,
      usage,
      reportUsage() {
        throw new MithrilError("NOT_IMPLEMENTED", "ctx.reportUsage() is only available inside a tool's execute().");
      },
      runtime: rt,
      transport,
      tools: readOnlyTools("a needsApproval predicate"),
      ...(opts.providers !== undefined ? { providers: opts.providers } : {}),
      emit(payload, type) {
        sink.push({ type: type ?? "custom.emit", payload });
      },
      suspend() {
        return Promise.reject(new MithrilError("NOT_IMPLEMENTED", "ctx.suspend() is only available inside a tool's execute()."));
      },
      journal(_key, fn) {
        return fn();
      },
    });
    // `callSignal` defaults to the run's signal; a tool with `timeoutMs` gets a per-call signal that also
    // aborts on expiry, so `ctx.signal` is always the narrowest deadline in scope.
    const execContext = (
      exec: ExecState,
      sink: EventBody[],
      ops: RegistryOp[],
      callId: string,
      toolName: string,
      callSignal: AbortSignal = signal,
    ): RunContext<Deps> => ({
      deps: opts.deps,
      runId,
      step,
      signal: callSignal,
      usage,
      // Spend inside a tool (a sub-agent, a direct provider call) is charged to THIS run: accrued into the
      // running totals the budget check reads, and emitted so the log and consumers see it as well.
      reportUsage(delta) {
        usage = { ...addUsage(usage, delta), steps: usage.steps };
        sink.push({ type: "usage", delta });
      },
      runtime: rt,
      transport,
      tools: deferredTools(ops, callId, toolName),
      ...(opts.providers !== undefined ? { providers: opts.providers } : {}),
      emit(payload, type) {
        sink.push({ type: type ?? "custom.emit", payload });
      },
      async suspend<Req extends SuspensionRequest>(req: Req) {
        const ord = exec.ordinal++;
        if (ord < exec.priorResolutions.length) return exec.priorResolutions[ord] as never;
        throw new SuspendSignal("midtool", req, exec.journal, exec.priorResolutions);
      },
      async journal(key, fn) {
        if (Object.hasOwn(exec.journal, key)) return exec.journal[key] as never;
        const v = await fn();
        exec.journal[key] = v as JsonValue;
        return v;
      },
    });
    const execMwContext = (sink: EventBody[]): MiddlewareContext<Deps> => ({
      deps: opts.deps,
      runId,
      step,
      signal,
      runtime: rt,
      journal: (_key, fn) => fn(),
      emit: (e) => {
        sink.push(e as EventBody);
      },
      steer: (message) => {
        messages.push({ role: "user", content: message, toolCalls: [] });
        steerPending = true;
      },
      halt: (error) => {
        if (haltError === undefined) haltError = error;
      },
      get halted() {
        return haltError !== undefined;
      },
      scope: <T>(key: string, init: () => T): T => {
        if (!mwStore.has(key)) mwStore.set(key, init());
        return mwStore.get(key) as T;
      },
    });

    // Registry mutations ride this exact path: their events are emitted, and the mutations applied, only
    // when the call commits — so the live registry and `replay(log)` agree by construction, and a call that
    // errors or suspends leaves the tool set untouched. They sit just before `tool.result` because that is
    // when they take effect; reporting them at the moment `register()` was *called* would imply a change
    // that a later throw would silently undo.
    const okSettled = (
      call: Call,
      span: SpanRef,
      output: JsonValue,
      ms: number,
      pre: readonly EventBody[],
      ops: readonly RegistryOp[] = [],
    ): Settled => ({
      span,
      events: [...pre, ...ops.map((o) => o.event), { type: "tool.result", callId: call.callId, output, ms }],
      commit: () => {
        for (const op of ops) op.apply();
        messages.push({ role: "tool", content: JSON.stringify(output), toolCalls: [] });
        outcomes.push({ callId: call.callId, name: call.name, input: call.input, ok: true });
      },
    });

    // Build the execution thunk for a call that must actually run (fresh-approved, edited, or Tier-2 replay).
    const makeRun =
      (call: Call, tool: AnyTool<Deps>, directive: Directive | undefined, span: SpanRef, sink: EventBody[]) => async (): Promise<Settled> => {
        const exec: ExecState =
          directive?.kind === "midtool"
            ? { journal: { ...directive.journal }, priorResolutions: [...directive.resolutions, directive.value], ordinal: 0 }
            : { journal: {}, priorResolutions: [], ordinal: 0 };
        const rawInput = directive?.kind === "edit" ? directive.input : call.input;
        const started = rt.now();
        const mwCtx = execMwContext(sink);
        const ops: RegistryOp[] = [];
        const core = async (inv: ToolInvocation): Promise<ToolOutcome> => {
          try {
            const parsed = await resolveInput(tool.inputSchema, inv.input);
            const onProgress = (payload: JsonValue): void => {
              sink.push({ type: "tool.progress", callId: inv.callId, payload });
            };
            // Bounding execute() rather than the middleware chain keeps the budget at tool altitude: a
            // middleware that retries gets a fresh budget per attempt.
            const raw =
              tool.timeoutMs === undefined
                ? await runExecute(tool, parsed, execContext(exec, sink, ops, inv.callId, inv.name), onProgress)
                : await runWithTimeout(tool.timeoutMs, inv.name, signal, (s) =>
                    runExecute(tool, parsed, execContext(exec, sink, ops, inv.callId, inv.name, s), onProgress),
                  );
            if (isSuspend(raw)) throw new SuspendSignal("return", raw.request, {}, []);
            const output = raw as JsonValue;
            // A declared outputSchema is enforced: a violating tool result is a classified tool.error the model
            // sees, catching a silent-bug class (and MCP structuredContent drift).
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
        }, core);
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
            const descriptor = reqToDescriptor(err.request, call.callId);
            const pending: PendingSuspension =
              err.kind === "midtool"
                ? { kind: "midtool", callId: call.callId, descriptor, journal: err.journal, resolutions: err.resolutions }
                : { kind: "return", callId: call.callId, descriptor };
            // A suspended call has not committed: anything it registered is abandoned, reservations included.
            // On resume the tool re-runs (Tier-2 replays from the journal) and registers again — idempotently,
            // since re-registering an identical digest is a no-op.
            releaseOps(ops);
            return { span, events: [...sink, { type: "suspend", descriptor }], pending };
          }
          // A tool-altitude middleware threw (not a suspension). Degrade to a model-visible tool.error rather
          // than crashing the whole run — a buggy guardrail must not take the run down with it.
          outcome = { callId: call.callId, status: "error", error: classifyToolError(err) };
        }
        if (outcome.status === "ok") return okSettled(call, span, outcome.output, rt.now() - started, sink, ops);
        // A failed call registers nothing — and its queued events are dropped rather than emitted, so the log
        // never reports a registration that did not happen.
        releaseOps(ops);
        const error = outcome.error;
        return {
          span,
          events: [...sink, { type: "tool.error", callId: call.callId, error }],
          commit: () => {
            messages.push({ role: "tool", content: JSON.stringify({ error: error.message }), toolCalls: [] });
            outcomes.push({ callId: call.callId, name: call.name, input: call.input, ok: false, error });
          },
        };
      };

    // Phase 1 — plan every call WITHOUT executing: resolve the tool, apply resume directives, and evaluate
    // Tier-1 approval predicates. No side-effecting tool body runs here.
    const plan = async (call: Call | undefined, directive: Directive | undefined): Promise<Plan> => {
      const span: SpanRef = { id: rt.randomUUID(), parentId: chatSpan.id, traceId, kind: "execute_tool" };
      if (call === undefined) return { span, settled: { span, events: [], commit: () => {} } };
      // Resolved against the step's snapshot — the identical array the model was offered — so what was
      // advertised is exactly what dispatches. A tool registered during this step lands in the next one.
      const tool = stepTools.find((t) => t.name === call.name);
      if (tool === undefined) {
        const known = stepTools.map((t) => t.name).join(", ");
        const error = classifiedError("UnknownTool", `No tool "${call.name}". Available tools: ${known}.`, "unknown_tool", { retryable: true });
        return {
          span,
          settled: {
            span,
            events: [{ type: "tool.error", callId: call.callId, error }],
            commit: () => {
              messages.push({ role: "tool", content: `error: unknown tool ${call.name}. Available tools: ${known}.`, toolCalls: [] });
              outcomes.push({ callId: call.callId, name: call.name, input: call.input, ok: false, error });
            },
          },
        };
      }
      if (directive?.kind === "reject") {
        const output: JsonValue = { approved: false, message: directive.message };
        return { span, settled: okSettled(call, span, output, 0, []) };
      }
      // Tier-1b: the tool already produced a suspend marker; the resolution IS its result. Do not re-run.
      if (directive?.kind === "return") return { span, settled: okSettled(call, span, directive.value, 0, []) };

      const sink: EventBody[] = [];
      if (directive === undefined) {
        const na = tool.needsApproval;
        const needs = na === undefined ? false : typeof na === "boolean" ? na : await na(call.input as never, approvalContext(sink));
        if (needs) {
          const descriptor: SuspensionDescriptor = {
            kind: "tool.approval",
            callId: call.callId,
            payload: { name: call.name, input: call.input },
            resolutionSchemaId: APPROVAL_SCHEMA_ID,
          };
          return {
            span,
            approval: { kind: "approval", callId: call.callId, descriptor },
            approvalEvents: [...sink, { type: "tool.approval.requested", callId: call.callId, name: call.name, input: call.input }, { type: "suspend", descriptor }],
          };
        }
      }
      return { span, run: makeRun(call, tool, directive, span, sink) };
    };

    const plans: Plan[] = new Array<Plan>(calls.length);
    await forEachConcurrent(calls.length, concurrency, async (i) => {
      plans[i] = await plan(calls[i], i === 0 ? firstDirective : undefined);
    });

    // The Tier-1 approval barrier is known without executing anything: the first call needing approval
    // suspends, and — exactly as a sequential loop would — no call at or after it runs.
    let approvalBarrier = calls.length;
    for (let i = 0; i < calls.length; i++) {
      if (plans[i]?.approval !== undefined) {
        approvalBarrier = i;
        break;
      }
    }

    // Phase 2 — execute the eligible prefix [0, approvalBarrier) concurrently. Settled plans need no work.
    const settled: (Settled | undefined)[] = new Array<Settled | undefined>(approvalBarrier);
    await forEachConcurrent(approvalBarrier, concurrency, async (i) => {
      const p = plans[i];
      settled[i] = p?.settled ?? (p?.run !== undefined ? await p.run() : undefined);
    });

    // A Tier-1b/Tier-2 suspension (discoverable only by running) forms a second barrier; the earliest wins.
    let suspendBarrier = approvalBarrier;
    for (let i = 0; i < approvalBarrier; i++) {
      if (settled[i]?.pending !== undefined) {
        suspendBarrier = i;
        break;
      }
    }
    const barrier = Math.min(approvalBarrier, suspendBarrier);

    // Flush [0, barrier) in strict call order: stamp each buffered event (deterministic seq) and commit.
    for (let i = 0; i < barrier; i++) {
      const s = settled[i];
      if (s === undefined) continue;
      for (const body of s.events) yield stamp(s.span, body);
      s.commit?.();
    }
    if (barrier >= calls.length) return { outcomes };
    // A mid-tool suspension takes precedence when it is the earlier barrier.
    if (suspendBarrier < approvalBarrier) {
      const s = settled[suspendBarrier];
      if (s?.pending !== undefined) {
        for (const body of s.events) yield stamp(s.span, body);
        return { suspend: s.pending, outcomes };
      }
    }
    // Otherwise the barrier is a Tier-1 approval gate.
    const gate = plans[barrier];
    if (gate?.approval !== undefined) {
      for (const body of gate.approvalEvents ?? []) yield stamp(gate.span, body);
      return { suspend: gate.approval, outcomes };
    }
    return { outcomes };
  }

  // ── entry: fresh vs resume ────────────────────────────────────────────────────────────────────────
  if (opts.resume === undefined) {
    if (typeof opts.input === "string") messages.push({ role: "user", content: opts.input, toolCalls: [] });
    else for (const m of opts.input) messages.push({ role: m.role, content: normalizeContent(m.content), toolCalls: [] });
    yield stamp(rootSpan, { type: "run.start", input: inputToJson(opts.input), model: modelId, depsDigest: "" });
    // Setups run after run.start (so their events have a valid position in the log) and before instructions
    // are computed (so a dynamic instructions function can describe the tools the run actually has).
    const setupFailure = yield* runSetups();
    if (setupFailure !== undefined) return setupFailure;
    const preCtx = makeCtx(-1, rootSpan, []);
    const instructions = typeof opts.instructions === "string" ? opts.instructions : await opts.instructions(preCtx);
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
  const resumeSpan: SpanRef = { id: rt.randomUUID(), parentId: rootSpan.id, traceId, kind: "chat" };
  const directive = resumeDirective(resume);
  const resolutionValue: JsonValue = "value" in directive ? directive.value : (directive as JsonValue);
  yield stamp(rootSpan, { type: "resume", resolutionFor: resume.pending.callId, value: resolutionValue });
  // Setups run on resume too — which is why they must be idempotent.
  const resumeSetupFailure = yield* runSetups();
  if (resumeSetupFailure !== undefined) return resumeSetupFailure;
  // …then the token REPLACES every definition-carrying entry. Replace, not merge: the token is the
  // authority on what this run held, so a tool revoked mid-run stays revoked instead of being resurrected
  // by a setup that reloads it from a store.
  try {
    yield* rehydrate(resume.tools ?? []);
  } catch (err) {
    const error = toSerializedError(err);
    yield stamp(rootSpan, { type: "run.error", error });
    return { status: "error", error, usage };
  }
  const preCtx = makeCtx(-1, rootSpan, []);
  const instructions = typeof opts.instructions === "string" ? opts.instructions : await opts.instructions(preCtx);
  const outcome = yield* runToolCalls(remaining, directive, resumeSpan, resume.step, registry.list());
  if (outcome.suspend !== undefined) return suspendedResult(outcome.suspend, resume.step);
  yield stamp(resumeSpan, { type: "step.finish", step: resume.step, stop: "tool", usage: ZERO_DELTA });
  return yield* stepLoop(instructions, resume.step + 1);

  // Run one step (model call + tool execution) fully, buffering its events into `sink` and returning a
  // structured next-action. The step altitude wraps this whole unit; the model altitude wraps the model
  // call inside it; the tool altitude wraps each tool; the finalize altitude wraps structured-output
  // validation. Self-correction (repair budgets, loop detection, output retry) lives in healing middleware,
  // which drive `steer`/`halt` via the middleware context — not in this function.
  type StepNext =
    | { readonly kind: "continue" }
    | { readonly kind: "outputInvalid"; readonly issues: JsonValue }
    | { readonly kind: "terminal"; readonly result: RunResult<JsonValue>; readonly reason: FinishReason }
    | { readonly kind: "suspend"; readonly pending: PendingSuspension };
  async function runStep(
    step: number,
    instructions: string,
    chatSpan: SpanRef,
    sink: MithrilEvent[],
    setNext: (n: StepNext) => void,
  ): Promise<StepOutcome> {
    sink.push(stamp(chatSpan, { type: "step.start", step }));
    // THE snapshot. Taken once per step and handed — as the identical array object — to both the model call
    // and tool dispatch, so the set the model is offered and the set that can dispatch cannot drift apart.
    // A registration that commits during this step is therefore invisible until step + 1.
    const stepTools = registry.list();
    const system = opts.output !== undefined ? instructions + outputHint : instructions;

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

    const result = await modelChain({ model: modelId, system, messages, tools: stepTools as readonly AnyTool<unknown>[] });
    const calls: Call[] = [...result.calls];
    usage = { ...addUsage(usage, result.usage), steps: usage.steps + 1 };
    messages.push({ role: "assistant", content: result.text, toolCalls: calls });

    if (calls.length === 0) {
      // Structured output: the finalize altitude extracts + validates the final text as JSON (peeling
      // reasoning/prose/fences with the shared lenient extractor). On success we complete; on failure a
      // `healing.outputRetry` finalize middleware (if installed) emits object.invalid and steers a re-ask or
      // halts — otherwise an invalid result ends the run immediately.
      if (opts.output !== undefined) {
        const outputSchema = opts.output;
        const finalizeCore = async (fc: FinalizeCall): Promise<FinalizeOutcome> => {
          const value: unknown = extractJson(fc.text) ?? fc.text;
          const validated = await outputSchema["~standard"].validate(value);
          if (validated.issues === undefined) return { status: "ok", value: validated.value as JsonValue };
          return { status: "invalid", issues: issuesToJson(validated.issues) };
        };
        const finalizeChain = middlewares.reduceRight<(c: FinalizeCall) => Promise<FinalizeOutcome>>((next, mw) => {
          const wrap = mw.finalize;
          return wrap === undefined ? next : (c) => wrap(mwCtx, c, next);
        }, finalizeCore);
        const fo = await finalizeChain({ step, text: result.text, retryHint: outputHint });
        if (fo.status === "ok") {
          sink.push(stamp(chatSpan, { type: "object.final", value: fo.value }));
          sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "output", usage: result.usage }));
          setNext({ kind: "terminal", result: { status: "completed", output: fo.value, usage }, reason: result.finishReason });
          return { step, stop: "output", usage: result.usage };
        }
        // Invalid. A finalize middleware may have steered (→ retry) or halted (→ terminal error); the step
        // loop resolves which based on steer/halt state. With no output-retry middleware it ends the run.
        const stop = haltError !== undefined ? "error" : "output";
        sink.push(stamp(chatSpan, { type: "step.finish", step, stop, usage: result.usage }));
        setNext({ kind: "outputInvalid", issues: fo.issues });
        return { step, stop, usage: result.usage };
      }
      sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "text", usage: result.usage }));
      setNext({ kind: "terminal", result: { status: "completed", output: result.text, usage }, reason: result.finishReason });
      return { step, stop: "text", usage: result.usage };
    }

    // Tools: drain the runToolCalls generator into the sink; a suspension short-circuits the step.
    const toolGen = runToolCalls(calls, undefined, chatSpan, step, stepTools);
    let toolResult: { readonly suspend?: PendingSuspension; readonly outcomes: readonly ToolStepOutcome[] } = { outcomes: [] };
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
    // The step is done. Its per-tool outcomes ride on the StepOutcome so step-altitude healing middleware
    // (retry budgets, loop detection) can inspect them and steer/halt — none of that logic lives here.
    sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "tool", usage: result.usage }));
    setNext({ kind: "continue" });
    return { step, stop: "tool", usage: result.usage, toolOutcomes: toolResult.outcomes };
  }

  // ── the step loop, shared by fresh + resume ─────────────────────────────────────────────────────────
  async function* stepLoop(instructions: string, from: number): AsyncGenerator<MithrilEvent, RunResult<JsonValue>> {
    const maxSteps = opts.maxSteps ?? 16;
    for (let step = from; step < maxSteps; step++) {
      steerPending = false; // reset the per-step steer latch; healing middleware may set it during the step
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
      }, (i) => runStep(i.step, instructions, chatSpan, sink, setNext));

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
      // A healing middleware's halt() latch wins over everything but a suspension: end the run now.
      if (haltError !== undefined) {
        yield stamp(rootSpan, { type: "run.finish", reason: "error", usage });
        return { status: "error", error: haltError, usage };
      }
      if (next.kind === "terminal") {
        yield stamp(rootSpan, { type: "run.finish", reason: next.reason, usage });
        return next.result;
      }
      // Structured output that failed validation with no middleware handling it (nobody steered a re-ask):
      // there is no way to make progress, so end with a clear typed error rather than looping to maxSteps.
      if (next.kind === "outputInvalid" && !steerPending) {
        const error: SerializedError = { name: "OutputInvalid", message: "structured output failed validation" };
        yield stamp(rootSpan, { type: "run.finish", reason: "error", usage });
        return { status: "error", error, usage };
      }
      // "continue" and a steered "outputInvalid" both advance to the next step.
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

// Bound one execute() by a tool's declared timeoutMs. Two halves, because they are different guarantees:
// the signal handed to `body` lets a well-behaved tool unwind cooperatively, while the race lets the loop
// stop *waiting* on one that does not. The loop cannot force a tool to stop — an ignored signal leaves the
// work running detached, it just no longer affects the run. The run's own signal is forwarded through, so a
// cancelled run still aborts a timed tool.
async function runWithTimeout<T>(
  ms: number,
  name: string,
  runSignal: AbortSignal,
  body: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const ctrl = new AbortController();
  const onAbort = (): void => ctrl.abort(runSignal.reason);
  if (runSignal.aborted) ctrl.abort(runSignal.reason);
  else runSignal.addEventListener("abort", onAbort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expiry = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      const err = new MithrilError("TOOL_TIMEOUT", `tool "${name}" exceeded its ${ms}ms timeout`);
      ctrl.abort(err);
      reject(err);
    }, ms);
  });
  const work = body(ctrl.signal);
  // The race's loser still settles; without a handler a late rejection surfaces as an unhandled rejection.
  work.catch(() => {});
  try {
    return await Promise.race([work, expiry]);
  } finally {
    clearTimeout(timer);
    runSignal.removeEventListener("abort", onAbort);
  }
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
