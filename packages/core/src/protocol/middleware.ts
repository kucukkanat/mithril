import type { RuntimeAdapter } from "./context.ts";
import type { EventMeta, EventOf, MithrilEvent } from "./events.ts";
import type { FinishReason, JsonValue, ModelId, SerializedError, UsageDelta } from "./primitives.ts";
import type { RunState } from "./state.ts";
import type { AnyTool, Tool, ToolInputOf } from "./tool.ts";

// §3.8 — producer-side composability. Middleware observes/transforms ONLY by reading & emitting events
// (no private side channel), so every extension stays replayable and inspectable. All four altitudes are
// wired: step (whole model+tools step), model (one model call), tool (one tool call), and finalize (the
// structured-output validate step). The built-in self-healing stack (`healing.*`) is just middleware over
// these altitudes — nothing in the loop is special-cased, so a user's own healing composes identically.

/** A tool call passed to a {@link Middleware.tool} wrapper. */
export type ToolInvocation = {
  readonly callId: string;
  readonly name: string;
  readonly input: JsonValue;
  readonly version?: string;
};

/** The result of a tool invocation: a successful `output` or a serialized `error`. */
export type ToolOutcome =
  | { readonly callId: string; readonly status: "ok"; readonly output: JsonValue }
  | { readonly callId: string; readonly status: "error"; readonly error: SerializedError };

/**
 * An un-stamped event a middleware may {@link MiddlewareContext.emit}; the loop stamps {@link EventMeta}.
 *
 * @remarks Besides the open `custom.*` escape hatch, a middleware may emit the self-correction events the
 * built-in `healing.*` stack produces — `tool.repair`, `tool.retry`, `loop.detected`, and `object.invalid` —
 * so a user-authored healing middleware yields the exact same, replayable event stream as the built-ins.
 */
export type DraftEvent =
  | { readonly type: `custom.${string}`; readonly payload: JsonValue }
  | Omit<EventOf<"tool.repair">, keyof EventMeta>
  | Omit<EventOf<"tool.retry">, keyof EventMeta>
  | Omit<EventOf<"loop.detected">, keyof EventMeta>
  | Omit<EventOf<"object.invalid">, keyof EventMeta>;

/**
 * The context handed to a {@link Middleware} — a subset of {@link RunContext}
 * without the tool-facing `deps.suspend` seam.
 *
 * @typeParam Deps - The caller-defined dependency bag.
 */
export interface MiddlewareContext<Deps> {
  readonly deps: Deps;
  readonly runId: string;
  readonly step: number;
  readonly signal: AbortSignal;
  readonly runtime: RuntimeAdapter;
  /** Journaled effect — the sanctioned store for a caching middleware (replayable, not a hidden closure). */
  journal<T>(key: string, fn: () => Promise<T>): Promise<T>;
  emit(event: DraftEvent): void;
  /**
   * Inject a `user` steering turn into the transcript and let the loop take another step (a re-ask). Used
   * by a healing middleware that wants the model to try again — e.g. loop-detection's nudge or structured
   * output's "your reply did not match the schema" retry. Emit the matching event yourself via {@link emit}.
   */
  steer(message: string): void;
  /**
   * End the run now with a typed terminal error — a healing middleware's halt decision (budget exhausted,
   * an unbreakable loop). The **first** halt of a run wins; later calls are ignored, and {@link halted}
   * flips to `true` so a middleware composed further out can bow out rather than pile on.
   */
  halt(error: SerializedError): void;
  /** `true` once any middleware has {@link halt}ed this run; a later middleware should no-op on its own guard. */
  readonly halted: boolean;
  /**
   * Run-scoped mutable state, created once per `key` and shared across every step of the run (never across
   * runs, so a reused agent's runs stay isolated). The sanctioned place for a healing middleware to keep its
   * per-run counters (repair budgets, loop signatures, retry attempts).
   */
  scope<T>(key: string, init: () => T): T;
}

/** The model-call input a {@link Middleware.model} wrapper observes or transforms. */
export interface ModelCall {
  readonly model: ModelId;
  readonly system: string;
  readonly messages: RunState["messages"];
  readonly tools: readonly AnyTool<unknown>[];
}

/** The result of one model invocation seen by a {@link Middleware.model} wrapper. */
export interface ModelResult {
  readonly text: string;
  readonly finishReason: FinishReason;
  readonly usage: UsageDelta;
  readonly calls: readonly { readonly callId: string; readonly name: string; readonly input: JsonValue }[];
}

/** The input to one step (model call + tool execution), observed by a {@link Middleware.step} wrapper. */
export interface StepInput {
  readonly step: number;
  readonly messages: RunState["messages"];
}

/**
 * A per-tool result summary surfaced on {@link StepOutcome.toolOutcomes}, so a step-altitude healing
 * middleware (retry budgets, loop detection) can inspect what each tool call did without re-deriving it.
 */
export interface ToolStepOutcome {
  readonly callId: string;
  readonly name: string;
  readonly input: JsonValue;
  readonly ok: boolean;
  readonly error?: SerializedError;
}

/**
 * The summary of one completed step seen by a {@link Middleware.step} wrapper.
 *
 * @remarks `stop` is how the step ended: `"text"`/`"output"` (a terminal answer), `"tool"` (tool calls ran,
 * the run continues), `"suspend"` (the step paused for HITL), or `"length"`/`"error"` (terminal). `usage` is
 * the step's own token delta. `toolOutcomes` lists each tool call's result when `stop` is `"tool"` (empty
 * otherwise) — the input a retry-budget / loop-detection middleware reads.
 */
export interface StepOutcome {
  readonly step: number;
  readonly stop: "text" | "tool" | "output" | "suspend" | "length" | "error";
  readonly usage: UsageDelta;
  readonly toolOutcomes?: readonly ToolStepOutcome[];
}

/**
 * The structured-output finalize unit wrapped by a {@link Middleware.finalize} handler: the model's final
 * assistant text plus a schema-shaped `retryHint` a middleware can append when steering a re-ask.
 */
export interface FinalizeCall {
  readonly step: number;
  readonly text: string;
  readonly retryHint: string;
}

/** The outcome of finalizing structured output: a validated `value`, or the schema `issues` that failed. */
export type FinalizeOutcome =
  | { readonly status: "ok"; readonly value: JsonValue }
  | { readonly status: "invalid"; readonly issues: JsonValue };

/**
 * Producer-side composability: observe or transform a run purely by wrapping
 * model and tool invocations.
 *
 * @typeParam Deps - The dependency bag shared with {@link MiddlewareContext}.
 *
 * @remarks
 * Middleware acts only through reading and emitting events (no private side
 * channel), so every extension stays replayable and inspectable. Four
 * altitudes wrap, from widest to narrowest: `step` (a whole model+tools step —
 * budgets, compaction, whole-step retry, loop detection), `model` (one model
 * call — caching, fallback models), `tool` (one tool call — guardrails,
 * memoization, arg repair), and `finalize` (the structured-output validate step
 * — schema-retry). The built-in `healing.*` stack is nothing more than one
 * middleware per altitude.
 */
export interface Middleware<Deps = unknown> {
  readonly name: string;
  /**
   * Wrap a whole step (its model call plus any tool execution). Runs outside `model`/`tool`. Short-circuit
   * by returning a {@link StepOutcome} without calling `next` (skip the step); enforce a token/step budget by
   * inspecting `ctx` before `next` and aborting via `ctx.signal`. Read `next`'s {@link StepOutcome.toolOutcomes}
   * to drive a retry budget or loop detection, steering/halting via {@link MiddlewareContext.steer}/`halt`.
   */
  step?: (
    ctx: MiddlewareContext<Deps>,
    input: StepInput,
    next: (i: StepInput) => Promise<StepOutcome>,
  ) => Promise<StepOutcome>;
  /** Wrap a single model invocation (retries, caching, prompt-cache ordering, fallback models). */
  model?: (
    ctx: MiddlewareContext<Deps>,
    call: ModelCall,
    next: (c: ModelCall) => Promise<ModelResult>,
  ) => Promise<ModelResult>;
  /** Wrap a single tool invocation. Short-circuit by returning without calling `next` (cache hit / block). */
  tool?: (
    ctx: MiddlewareContext<Deps>,
    call: ToolInvocation,
    next: (c: ToolInvocation) => Promise<ToolOutcome>,
  ) => Promise<ToolOutcome>;
  /**
   * Wrap the structured-output finalize step (only runs when the agent has an `output` schema and the model
   * answered with no tool calls). On an `invalid` {@link FinalizeOutcome}, re-ask by calling
   * {@link MiddlewareContext.steer} (append `call.retryHint`) or give up with `halt`; emit `object.invalid`
   * yourself so the retry stays visible.
   */
  finalize?: (
    ctx: MiddlewareContext<Deps>,
    call: FinalizeCall,
    next: (c: FinalizeCall) => Promise<FinalizeOutcome>,
  ) => Promise<FinalizeOutcome>;
}

/** A passive observer that receives every {@link MithrilEvent} in order. */
export interface EventConsumer {
  readonly name: string;
  onEvent(e: MithrilEvent): void;
}

/** The registration surface passed to a {@link Plugin.setup}, for contributing plugin fragments. */
export interface PluginHost {
  register<Deps>(fragment: Partial<Plugin<Deps>>): void;
}

/**
 * A bundle of tools, middleware, and event consumers registered as a unit.
 *
 * @typeParam Deps - The dependency bag the plugin's tools and middleware require.
 * @typeParam Tools - The plugin's tool tuple, preserved so {@link InferPluginTools} can recover names/inputs.
 *
 * @remarks
 * `Tools` is carried (with a phantom `__tools` field, erased at build) so plugin
 * tool types survive inference. `const` is applied at the `plugin()` factory's
 * call signature, not here — it is invalid on an interface type parameter.
 */
export interface Plugin<Deps = unknown, Tools extends readonly AnyTool<Deps>[] = readonly AnyTool<Deps>[]> {
  readonly name: string;
  readonly tools?: Tools;
  readonly middleware?: readonly Middleware<Deps>[];
  readonly consumers?: readonly EventConsumer[];
  readonly setup?: (host: PluginHost) => void | Promise<void>;
  /** Phantom carrier for `Tools` inference; erased at build. */
  readonly __tools?: Tools;
}

/**
 * Recover a `{ [toolName]: { input } }` map from a {@link Plugin} (or a factory
 * returning one), for typed access to a plugin's tool inputs.
 */
export type InferPluginTools<P> = P extends (...args: readonly never[]) => infer R
  ? InferPluginTools<R>
  : P extends Plugin<infer _D, infer T>
    ? { [E in T[number] as E extends Tool<infer N, infer _I, infer _O, infer _Dp> ? N : never]: { input: ToolInputOf<E> } }
    : never;
