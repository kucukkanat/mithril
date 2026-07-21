import type { RuntimeAdapter } from "./context.ts";
import type { MithrilEvent } from "./events.ts";
import type { FinishReason, JsonValue, ModelId, SerializedError, UsageDelta } from "./primitives.ts";
import type { RunState } from "./state.ts";
import type { AnyTool, Tool, ToolInputOf } from "./tool.ts";

// §3.8 — producer-side composability. Middleware observes/transforms ONLY by reading & emitting events
// (no private side channel), so every extension stays replayable and inspectable. This slice implements
// the tool altitude (the highest-value one: guardrails, memoization, drift); model/step altitudes need the
// emit-based loop refactor and are a follow-up.

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

/** An un-stamped `custom.*` event a middleware may emit; the loop stamps {@link EventMeta}. */
export type DraftEvent = { readonly type: `custom.${string}`; readonly payload: JsonValue };

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
 * The summary of one completed step seen by a {@link Middleware.step} wrapper.
 *
 * @remarks `stop` is how the step ended: `"text"`/`"output"` (a terminal answer), `"tool"` (tool calls ran,
 * the run continues), `"suspend"` (the step paused for HITL), or `"length"`/`"error"` (terminal). `usage` is
 * the step's own token delta.
 */
export interface StepOutcome {
  readonly step: number;
  readonly stop: "text" | "tool" | "output" | "suspend" | "length" | "error";
  readonly usage: UsageDelta;
}

/**
 * Producer-side composability: observe or transform a run purely by wrapping
 * model and tool invocations.
 *
 * @typeParam Deps - The dependency bag shared with {@link MiddlewareContext}.
 *
 * @remarks
 * Middleware acts only through reading and emitting events (no private side
 * channel), so every extension stays replayable and inspectable. Three
 * altitudes wrap, from widest to narrowest: `step` (a whole model+tools step —
 * budgets, compaction, whole-step retry), `model` (one model call — caching,
 * fallback models), and `tool` (one tool call — guardrails, memoization, drift).
 */
export interface Middleware<Deps = unknown> {
  readonly name: string;
  /**
   * Wrap a whole step (its model call plus any tool execution). Runs outside `model`/`tool`. Short-circuit
   * by returning a {@link StepOutcome} without calling `next` (skip the step); enforce a token/step budget by
   * inspecting `ctx` before `next` and aborting via `ctx.signal`.
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
