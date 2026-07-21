// §3.1 — shared value types. JSON-safe AND structured-clone-safe: no functions, class instances,
// bigint, or Date. Everything on the wire is one of these.

/**
 * Any value that is both JSON-safe and structured-clone-safe.
 *
 * @remarks
 * Excludes functions, class instances, `bigint`, and `Date`. Every value that
 * crosses the wire — event payloads, tool input/output, suspension payloads —
 * is one of these.
 */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [k: string]: JsonValue };

// Compile-time assertion applied at boundaries that PRODUCE wire values (tool output, structured output,
// suspension payload). Fails at definition, not at structuredClone.
/**
 * Compile-time assertion that `T` is {@link JsonValue}: resolves to `T` when
 * safe, otherwise `never`.
 *
 * @remarks
 * Applied at boundaries that produce wire values (tool output, structured
 * output, suspension payload) so a non-serializable shape fails at its
 * definition rather than later at `structuredClone`.
 */
export type JsonSafe<T> = T extends JsonValue ? T : never;

/**
 * A `'provider/model'` identifier, e.g. `'anthropic/claude-...'`.
 *
 * @remarks
 * The template only guarantees the `slash` shape; the concrete model is
 * validated at runtime against the provider spec.
 */
export type ModelId = `${string}/${string}`;

/** Why a model turn or run stopped generating. */
export type FinishReason = "stop" | "length" | "tool_calls" | "content_filter" | "error";

/** Token counts and cost for a single accounting event. */
export interface UsageDelta {
  readonly input: number;
  readonly output: number;
  readonly cacheRead: number;
  readonly cacheWrite: number;
  readonly reasoning: number;
  /** Cost in integer micro-USD — avoids float drift when summing thousands of deltas. */
  readonly costMicroUsd: number;
}

/** A running usage accumulator: a {@link UsageDelta} plus a completed-step count. */
export interface UsageTotals extends UsageDelta {
  /** Number of completed steps; carried (not summed) by {@link addUsage}. */
  readonly steps: number;
}

/** A JSON-safe serialized form of a thrown error, suitable for the wire. */
export interface SerializedError {
  readonly name: string;
  readonly message: string;
  /** Whether the operation may be retried; absent means unknown. */
  readonly retryable?: boolean;
  /** Optional structured error detail. */
  readonly data?: JsonValue;
}

/** The zero element for {@link UsageTotals} — all counts and steps at `0`. */
export const ZERO_USAGE: UsageTotals = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  reasoning: 0,
  costMicroUsd: 0,
  steps: 0,
};

/**
 * Immutably sum a totals accumulator and a per-event delta.
 *
 * @param totals - The running accumulator.
 * @param delta - The per-event usage to fold in.
 * @returns A new {@link UsageTotals}; `steps` is carried from `totals`, not summed.
 */
export function addUsage(totals: UsageTotals, delta: UsageDelta): UsageTotals {
  return {
    input: totals.input + delta.input,
    output: totals.output + delta.output,
    cacheRead: totals.cacheRead + delta.cacheRead,
    cacheWrite: totals.cacheWrite + delta.cacheWrite,
    reasoning: totals.reasoning + delta.reasoning,
    costMicroUsd: totals.costMicroUsd + delta.costMicroUsd,
    steps: totals.steps,
  };
}
