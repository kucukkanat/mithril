/**
 * Custom promptfoo assertions for the harness-level signals that plain text matchers can't see —
 * chiefly WHICH tools the model called and with WHAT arguments. The provider records those on the
 * response metadata (`providerResponse.metadata.toolCalls`); these functions read them back.
 *
 * Reference an assertion from a suite as, e.g.:
 *   - type: javascript
 *     value: file://src/grading.ts:expectToolCalls
 * and drive it with a test var (`expectToolCalls`, `reachCompletion`, …) — see the suite files.
 */

interface ObservedToolCall {
  readonly name: string;
  readonly input?: unknown;
}

interface AssertionContext {
  readonly vars?: Record<string, unknown>;
  readonly providerResponse?: { readonly metadata?: { readonly toolCalls?: readonly ObservedToolCall[]; readonly status?: string } };
}

interface GradingResult {
  readonly pass: boolean;
  readonly score: number;
  readonly reason: string;
}

function observedCalls(context: AssertionContext): readonly ObservedToolCall[] {
  return context.providerResponse?.metadata?.toolCalls ?? [];
}

function result(pass: boolean, reason: string): GradingResult {
  return { pass, score: pass ? 1 : 0, reason };
}

/** Shallow-check that every key in `expected` is present and deep-equal in the call's `input`. */
function argsMatch(input: unknown, expected: Record<string, unknown>): boolean {
  if (typeof input !== "object" || input === null) return false;
  const rec = input as Record<string, unknown>;
  return Object.entries(expected).every(([k, v]) => JSON.stringify(rec[k]) === JSON.stringify(v));
}

/**
 * Assert the run made the expected tool call(s). Drive it with a `expectToolCalls` var — an array of
 * `{ name, args? }`. Every entry must match some observed call by name (and, if `args` given, by those
 * argument values). Passing an empty array asserts NO tools were called.
 */
export function expectToolCalls(_output: string, context: AssertionContext): GradingResult {
  const expected = context.vars?.["expectToolCalls"];
  const calls = observedCalls(context);
  if (!Array.isArray(expected)) {
    return result(false, "expectToolCalls var is missing or not an array");
  }
  if (expected.length === 0) {
    return calls.length === 0
      ? result(true, "no tools called, as expected")
      : result(false, `expected no tool calls, but got: ${calls.map((c) => c.name).join(", ")}`);
  }
  const observedNames = calls.map((c) => c.name).join(", ") || "(none)";
  for (const want of expected as ReadonlyArray<{ name: string; args?: Record<string, unknown> }>) {
    const match = calls.find((c) => c.name === want.name && (want.args === undefined || argsMatch(c.input, want.args)));
    if (match === undefined) {
      const withArgs = want.args !== undefined ? ` with args ${JSON.stringify(want.args)}` : "";
      return result(false, `expected a "${want.name}" call${withArgs}; observed calls: ${observedNames}`);
    }
  }
  return result(true, `all expected tool calls present (observed: ${observedNames})`);
}

/** Assert the run reached a completed status (useful for the structured-output suite). */
export function reachedCompletion(_output: string, context: AssertionContext): GradingResult {
  const status = context.providerResponse?.metadata?.status ?? "unknown";
  return status === "completed"
    ? result(true, "run completed")
    : result(false, `run did not complete (status: ${status})`);
}
