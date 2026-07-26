import type { RunContext } from "./context.ts";
import type { JsonSafe, JsonValue } from "./primitives.ts";
import type { StandardSchemaV1 } from "./standard-schema.ts";
import type { Suspend } from "./suspension.ts";

// §3.3 — a tool: Standard Schema in/out, typed DI. `In`/`Out` are recovered from the schema/execute by
// the tool() factory; here they are the already-resolved type parameters.
/** An intermediate value yielded by a streaming tool's `execute` generator, surfaced as `tool.progress`. */
export interface ToolProgress {
  readonly payload: JsonValue;
}

/**
 * A typed tool: Standard Schema in/out plus typed dependency injection.
 *
 * @typeParam Name - The tool's literal name.
 * @typeParam In - The validated input type (recovered from `inputSchema`).
 * @typeParam Out - The output type (recovered from `execute`/`outputSchema`).
 * @typeParam Deps - The dependencies injected via {@link RunContext}.
 *
 * @remarks
 * `In`/`Out` are the already-resolved type parameters; the `tool()` factory
 * recovers them from the schema and `execute` signature. `execute` may return a
 * promise or an {@link AsyncGenerator} that yields {@link ToolProgress} and
 * returns the final output.
 */
export interface Tool<Name extends string, In, Out, Deps> {
  readonly name: Name;
  readonly description: string;
  /**
   * Optional version, stamped onto every `tool.call` event this tool produces.
   *
   * @remarks Recorded for observability only — the loop does not compare it against anything, so a stored
   * run resumed after a tool changed will NOT report drift. Consuming the stamped value to detect that is
   * left to the caller.
   */
  readonly version?: string;
  /**
   * Optional few-shot example inputs, surfaced into the tool's wire description. A handful of concrete
   * example calls is the single strongest prompt-side lift for small models' tool-call reliability.
   */
  readonly examples?: readonly JsonValue[];
  readonly inputSchema: StandardSchemaV1<unknown, In>;
  readonly outputSchema?: StandardSchemaV1<unknown, JsonSafe<Out>>;
  /** Whether the call requires human approval; a predicate can decide per-input. */
  readonly needsApproval?: boolean | ((input: In, ctx: RunContext<Deps>) => boolean | Promise<boolean>);
  /**
   * Wall-clock budget for a single `execute`, in milliseconds. Exceeding it produces a `tool.error`
   * classified `"timeout"`.
   *
   * @remarks
   * Bounds `execute` only — not the surrounding tool middleware — so a middleware that retries gets a
   * fresh budget per attempt. While it runs, `ctx.signal` is a *per-call* signal that aborts on expiry
   * (and still forwards the run's own abort), so a well-behaved tool can unwind cooperatively. The loop
   * can stop **waiting** on a tool but cannot force one to stop: a tool that ignores `ctx.signal` keeps
   * running detached, it merely no longer affects the run. Omit for no budget.
   */
  readonly timeoutMs?: number;
  execute(
    input: In,
    ctx: RunContext<Deps>,
  ):
    | Promise<JsonSafe<Out> | Suspend<JsonSafe<Out>>>
    | AsyncGenerator<ToolProgress, JsonSafe<Out> | Suspend<JsonSafe<Out>>>;
}

// Variance-correct upper bound for heterogeneous tool tuples. `In` is invariant in `Tool` (covariant in the
// inputSchema output slot, contravariant in execute/needsApproval params), so no single `Tool<string, X, …>`
// is a supertype of every concrete tool. The bound is a structural shape: `never` in input positions
// (bottom ⇒ accepts any concrete input contravariantly), `unknown`/JsonValue in output positions (top).
// Concrete In/Out survive in the `const Tools` capture, so ToolInputOf/ToolCallFor stay precise.
/**
 * The variance-correct upper bound for a heterogeneous tuple of tools.
 *
 * @typeParam Deps - The shared dependency type injected into every tool.
 *
 * @remarks
 * Because `In` is invariant in {@link Tool}, no single `Tool<string, X, …>` is a
 * supertype of every concrete tool. This bound is a structural shape using
 * `never` in input positions (accepts any concrete input contravariantly) and
 * top types in output positions. Concrete `In`/`Out` survive in a
 * `const Tools` capture, so {@link ToolInputOf} and {@link ToolCallFor} stay precise.
 */
export type AnyTool<Deps> = {
  readonly name: string;
  readonly description: string;
  readonly version?: string;
  readonly examples?: readonly JsonValue[];
  readonly inputSchema: StandardSchemaV1<unknown, unknown>;
  readonly outputSchema?: StandardSchemaV1<unknown, JsonValue>;
  readonly needsApproval?: boolean | ((input: never, ctx: RunContext<Deps>) => boolean | Promise<boolean>);
  readonly timeoutMs?: number;
  execute(input: never, ctx: RunContext<Deps>): unknown;
};

/** Recover the validated input type of a {@link Tool} `T`, or `never`. */
export type ToolInputOf<T> = T extends Tool<infer _N, infer In, infer _O, infer _D> ? In : never;
/** Recover the output type of a {@link Tool} `T`, or `never`. */
export type ToolOutputOf<T> = T extends Tool<infer _N, infer _In, infer Out, infer _D> ? Out : never;
