import type {
  AnyTool,
  JsonSchemaConverter,
  JsonValue,
  Middleware,
  MithrilEvent,
  ModelInput,
  Plugin,
  ProviderRegistry,
  RunContext,
  RunState,
  RuntimeAdapter,
  SerializedError,
  StandardSchemaV1,
  SuspensionDescriptor,
  Transport,
  UsageTotals,
} from "../protocol/index.ts";
import type { ResumeValue } from "./loop.ts";
import { MithrilError, RETRYABLE_CODES } from "./registry.ts";

/**
 * A single conversation turn supplied as run input — either a `user` or `assistant` message.
 *
 * @see {@link Input} for the aggregate input shape accepted by {@link Agent.run}.
 */
export type InputMessage =
  | { readonly role: "user"; readonly content: string }
  | { readonly role: "assistant"; readonly content: string };

/**
 * The input to a run: either a bare string (treated as a single `user` message) or an
 * ordered list of {@link InputMessage}s (a pre-seeded conversation).
 */
export type Input = string | readonly InputMessage[];

/**
 * The `Deps` slot of {@link RunOptions}: required when the agent has dependencies, and optional (may be
 * omitted, or given as `undefined`) when `Deps` is `void`. This is what lets a no-deps agent pass a bare
 * `{ signal }` without the `deps: undefined` ceremony.
 */
export type DepsOption<Deps> = [Deps] extends [void] ? { readonly deps?: undefined } : { readonly deps: Deps };

/** The run options common to every agent, independent of whether it has dependencies. */
export interface RunOptionsBase<Deps = unknown> {
  readonly transport?: Transport; // omitted ⇒ byok from env
  readonly providers?: ProviderRegistry; // omitted ⇒ model must be a self-wiring handle
  readonly signal?: AbortSignal; // timeout idiom: AbortSignal.timeout(ms)
  readonly runtime?: RuntimeAdapter;
  readonly maxSteps?: number;
  readonly maxTokens?: number; // input+output token budget for the whole run; unset ⇒ unbounded
  readonly maxCostMicroUsd?: number; // cost budget in integer micro-USD; unset ⇒ unbounded
  // Self-healing stack. Omitted ⇒ the batteries-included default (arg-repair, loop guard, retry budget,
  // output retry); `false`/`[]` ⇒ a raw loop; an explicit array ⇒ pick/configure the healing middleware.
  // Crash-hardening (a throwing provider/middleware/tool becomes a typed run.error) is never disabled.
  readonly healing?: false | readonly Middleware<Deps>[];
}

/**
 * Per-run options passed to {@link Agent.run}, {@link Agent.stream}, and {@link Agent.resume}.
 *
 * @typeParam Deps - the dependency object injected into tool/instruction {@link RunContext}s.
 * @remarks
 * `deps` is required only when `Deps` is non-`void`; a no-deps agent may pass `{ signal }` (or any other
 * option) with no `deps` field at all. `transport` omitted falls back to BYOK resolved from the environment
 * (`<PROVIDER>_API_KEY`). `providers` omitted requires `model` to be a self-wiring {@link ModelHandle}.
 * Cancellation is driven by `signal` — the timeout idiom is `AbortSignal.timeout(ms)`.
 */
export type RunOptions<Deps> = DepsOption<Deps> & RunOptionsBase<Deps>;

/**
 * The trailing argument tuple of the run methods, made optional when `Deps` is `void`.
 *
 * @remarks A no-deps agent (`Deps = void`) needs no options object at all: `await agent.run("hi")`.
 */
export type RunArgs<Deps> = [Deps] extends [void] ? [opts?: RunOptions<void>] : [opts: RunOptions<Deps>];

/**
 * The discriminated result of a completed, suspended, or failed run.
 *
 * @typeParam Out - the run's output type (the validated structured value, or `string`).
 * @remarks Discriminate on `.status`:
 * - `"completed"` — carries the final `output` and `usage`.
 * - `"suspended"` — the run is waiting on a human/external resolution (Tier-1 approval, a Tier-1b
 *   tool-returned `suspend(...)`, or a Tier-2 `ctx.suspend()`). `request` is the UI-facing pending view;
 *   `token` is the resume handle (unsigned durable-local JSON by default — {@link seal} it before crossing
 *   a trust boundary). Resume via {@link Agent.resume} (drains to a result) or {@link Agent.resumeStream}
 *   (streams the resumed run).
 * - `"unresumable"` — a resume `token` no longer matches a pending tool call; `reason` explains why.
 * - `"error"` — carries a {@link SerializedError} and `usage`.
 * - `"cancelled"` — the run's `signal` aborted; carries `usage`.
 */
export type RunResult<Out> =
  | { readonly status: "completed"; readonly output: Out; readonly usage: UsageTotals }
  // Tier-1 HITL: a tool needs approval. `token` (unsigned durable-local JSON by default — seal() it before
  // crossing a trust boundary) is resumed via agent.resume(token, decision, opts). `request` is the pending view.
  | { readonly status: "suspended"; readonly request: SuspensionDescriptor; readonly token: string }
  | { readonly status: "unresumable"; readonly request: SuspensionDescriptor; readonly reason: string }
  | { readonly status: "error"; readonly error: SerializedError; readonly usage: UsageTotals }
  | { readonly status: "cancelled"; readonly usage: UsageTotals };

/**
 * A live handle over a streaming run, returned by {@link Agent.stream}.
 *
 * @typeParam Out - the run's output type, resolved by {@link RunHandle.result}.
 * @remarks Members:
 * - iterating the handle itself (it is `AsyncIterable<MithrilEvent>`) or `events` yields every
 *   {@link MithrilEvent} from a buffered broadcast — each iterator gets the full stream.
 * - `text` yields only assistant `text.delta` payloads as strings.
 * - `state()` returns a {@link RunState} replay of the events buffered so far.
 * - `result()` resolves with the terminal {@link RunResult} when the run ends.
 * - `cancel()` aborts the run at the next step boundary (or mid-provider-stream); `result()` then
 *   resolves `"cancelled"`. Equivalent to aborting {@link RunOptions.signal}.
 * - `resolve()` continues an in-process suspension by streaming the resumed run as a fresh
 *   {@link RunHandle} — no token round-trip. Rejects if the run did not suspend.
 */
export interface RunHandle<Out> extends AsyncIterable<MithrilEvent> {
  readonly runId: string;
  readonly events: AsyncIterable<MithrilEvent>;
  readonly text: AsyncIterable<string>;
  state(): RunState; // = replay of the buffered log so far
  result(): Promise<RunResult<Out>>;
  cancel(reason?: string): void;
  // In-process streaming resume: await the (suspended) result, then continue the SAME run as a new handle.
  resolve(resolution: ResumeValue): Promise<RunHandle<Out>>;
}

/**
 * A per-step view yielded by {@link Agent.iterate}: the step index, the events emitted during it, and a
 * {@link RunState} replay of the whole run so far.
 */
export interface StepSnapshot {
  readonly step: number;
  readonly events: readonly MithrilEvent[];
  readonly state: RunState;
}

// NOTE: `const` type-parameter modifiers are only valid on FUNCTIONS/call signatures (it's on AgentFactory
// below), never on an interface's type parameters — `interface AgentConfig<const Tools…>` is a syntax error.
// `Out` is inferred from `output`'s schema (naked position) so a structured agent produces its typed value.
/**
 * The declarative configuration of an agent, passed to {@link agent} (or a harness-bound factory).
 *
 * @typeParam Tools - the tuple of tools available to the model; drives typed tool inference.
 * @typeParam Deps - the dependency object injected into tool/instruction {@link RunContext}s.
 * @typeParam Out - the output type, inferred from `output`'s schema (or `string` when absent).
 * @remarks
 * - `model` is a {@link ModelInput} (a self-wiring {@link ModelHandle} or a `provider/model` id).
 * - `instructions` may be a static string or a function of {@link RunContext} (resolved per run).
 * - `maxSteps` defaults to 16.
 * - `output` opts into structured output: the final text is parsed and validated against the schema; the
 *   default {@link healing} stack re-asks the model on a validation failure before giving up.
 * - `healing` is the pluggable self-healing stack ({@link Middleware}). Omitted ⇒ the batteries-included
 *   default (arg-repair, loop guard, per-tool retry budget, structured-output retry). Pass `false` (or
 *   `[]`) for the raw loop — no arg coercion, no loop detection, unbounded tool retries, no output retry;
 *   or pass an explicit array to pick/configure behaviors, e.g. `healing: [healing.loopGuard({ haltAt: 3 })]`.
 *   Crash-hardening (a throwing provider/middleware becomes a typed `run.error`) is never disabled.
 * - `use` composes plugins and middleware (§3.8).
 */
export interface AgentConfig<Tools extends readonly AnyTool<Deps>[], Deps, Out extends JsonValue = string> {
  readonly model: ModelInput;
  readonly instructions: string | ((ctx: RunContext<Deps>) => string | Promise<string>);
  readonly tools?: Tools;
  readonly maxSteps?: number; // default 16
  readonly output?: StandardSchemaV1<unknown, Out>; // structured output: validate → (default) retry
  // Optional converter from the `output` Standard Schema to a JSON Schema, injected into the prompt so the
  // model sees the exact field names/types (a major small-model reliability lift). E.g. Zod v4:
  // `(s) => z.toJSONSchema(s as z.ZodType)`. Absent ⇒ self-describing schemas still work; else the bare hint.
  readonly outputSchema?: JsonSchemaConverter;
  readonly maxTokens?: number; // input+output token budget for the whole run; unset ⇒ unbounded
  readonly maxCostMicroUsd?: number; // cost budget in integer micro-USD; unset ⇒ unbounded
  // Self-healing stack; omitted ⇒ the batteries-included default. `false`/`[]` ⇒ a raw loop; an explicit
  // array ⇒ pick/configure the healing middleware (see the `healing` namespace). See @remarks above.
  readonly healing?: false | readonly Middleware<Deps>[];
  readonly use?: readonly (Plugin<Deps> | Middleware<Deps>)[]; // §3.8 composability
}

/**
 * A configured, runnable agent produced by {@link agent}.
 *
 * @typeParam Tools - the tuple of tools available to the model.
 * @typeParam Deps - the dependency object injected into each run.
 * @typeParam Out - the run output type ({@link RunResult}'s `output`).
 * @remarks Methods:
 * - `run` drains the loop to a single terminal {@link RunResult}.
 * - `stream` returns a {@link RunHandle} for incremental event/text consumption.
 * - `iterate` yields a {@link StepSnapshot} at each step boundary for step-level control; abandoning the
 *   iterator (a `break`/`return`) cancels the run.
 * - `resume` continues any suspension from its `token` and a {@link ResumeValue} (an {@link ApprovalDecision}
 *   for Tier-1 approval, or `{ kind: "resolve", value }` for a Tier-1b/Tier-2 resolution). It returns the
 *   final {@link RunResult} and does not re-stream events.
 * - `resumeStream` is `resume`'s streaming form: it returns a {@link RunHandle} over the resumed run.
 * - `deps`/`tools`/`instructions` are always re-provided via the reconstructed agent and `opts`; nothing
 *   is deserialized into behavior.
 * - `__tools` is a phantom type carrier for UI-tool inference; it is erased at build and never populated.
 */
export interface Agent<Tools extends readonly AnyTool<Deps>[], Deps, Out extends JsonValue = string> {
  run(input: Input, ...opts: RunArgs<Deps>): Promise<RunResult<Out>>;
  stream(input: Input, ...opts: RunArgs<Deps>): RunHandle<Out>;
  iterate(input: Input, ...opts: RunArgs<Deps>): AsyncGenerator<StepSnapshot, RunResult<Out>>;
  // Cross-process resume. deps/tools/instructions are re-provided via the reconstructed agent + opts;
  // nothing is deserialized into behavior.
  resume(token: string, resolution: ResumeValue, ...opts: RunArgs<Deps>): Promise<RunResult<Out>>;
  resumeStream(token: string, resolution: ResumeValue, ...opts: RunArgs<Deps>): RunHandle<Out>;
  readonly __tools?: Tools; // phantom carrier for InferUITools; erased at build
}

/**
 * A `Deps`-bound agent constructor: call it with an {@link AgentConfig} to get an {@link Agent}.
 *
 * @typeParam Deps - the dependency object every agent built by this factory injects.
 * @remarks Returned by `agent<Deps>()` and by {@link createHarness}, so tool/agent definitions
 * don't have to restate `<Deps>` at each call site. `Tools` and `Out` are inferred from the config.
 */
export interface AgentFactory<Deps> {
  <const Tools extends readonly AnyTool<Deps>[] = [], const Out extends JsonValue = string>(
    config: AgentConfig<Tools, Deps, Out>,
  ): Agent<Tools, Deps, Out>;
}

/**
 * Normalize an unknown thrown value into a JSON-safe {@link SerializedError}.
 *
 * @param err - the caught value. A {@link MithrilError} additionally carries its `code` onto
 * `data.code` and sets `retryable` for {@link RETRYABLE_CODES}; other `Error`s keep `name`/`message`;
 * anything else is stringified.
 * @returns a `SerializedError` safe to embed in events and results.
 */
export function toSerializedError(err: unknown): SerializedError {
  if (err instanceof MithrilError) {
    return {
      name: err.name,
      message: err.message,
      ...(RETRYABLE_CODES.has(err.code) ? { retryable: true } : {}),
      data: { code: err.code },
    };
  }
  if (err instanceof Error) return { name: err.name, message: err.message };
  return { name: "Error", message: String(err) };
}

/**
 * Project run {@link Input} into its JSON-safe form for the `run.start` event.
 *
 * @param input - a bare string or a list of {@link InputMessage}s.
 * @returns the string unchanged, or an array of `{ role, content }` objects.
 */
export function inputToJson(input: Input): JsonValue {
  if (typeof input === "string") return input;
  return input.map((m) => ({ role: m.role, content: m.content }));
}
