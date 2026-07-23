/**
 * Reference-trajectory matching: assert that a run called the *right tools with the right arguments in the
 * right shape*, by comparing its recorded `tool.call`s against a pinned golden {@link ReferenceTrajectory}.
 * The centerpiece of trajectory-native evaluation — a single {@link Scorer} covering ordering, presence, and
 * argument-level assertions that would otherwise need a fistful of {@link calledTool}/{@link calledInOrder}
 * checks. Pure and zero-dependency; runs anywhere a {@link Scorer} runs (Node, Bun, the browser).
 *
 * @packageDocumentation
 */

import type { JsonValue } from "@mithril/core/protocol";
import type { Scorer, Trajectory } from "./index.ts";

/**
 * How the ordered list of a run's `tool.call`s is compared against the reference.
 *
 * @remarks
 * - `"strict"` — same calls, same order, 1:1 (no extra, no missing).
 * - `"unordered"` — the same multiset of calls in any order.
 * - `"superset"` (default) — the reference is an ordered subsequence of the actual calls; extra calls are
 *   allowed. The forgiving default: "it did at least these, in this order."
 * - `"subset"` — every actual call matches some reference step (the run stayed within the allowed set); it
 *   may do fewer. The restraint check: "it did nothing outside this set."
 */
export type TrajectoryMatchMode = "strict" | "unordered" | "superset" | "subset";

/**
 * How each matched call's `input` is compared against the reference step's `input`.
 *
 * @remarks Per step, the default is `"exact"` when the reference step carries an `input`, else `"ignore"`.
 * - `"exact"` — deep structural equality.
 * - `"ignore"` — match on tool name only.
 * - `"subset"` — the reference `input` is contained in the actual `input` (the call had *at least* these args).
 * - `"superset"` — the actual `input` is contained in the reference `input` (the call had *no args beyond* these).
 */
export type ToolArgsMatchMode = "exact" | "ignore" | "subset" | "superset";

/** One expected tool call in a {@link ReferenceTrajectory}: a tool name and, optionally, the args to match. */
export interface ReferenceStep {
  readonly tool: string;
  readonly input?: JsonValue;
}

/** A pinned golden sequence of expected {@link ReferenceStep}s, e.g. from {@link referenceFromTrajectory}. */
export type ReferenceTrajectory = readonly ReferenceStep[];

/** Options for {@link matchesTrajectory}. */
export interface MatchOptions {
  /** Sequence-comparison mode (default `"superset"`). */
  readonly mode?: TrajectoryMatchMode;
  /** Argument-comparison mode applied to every step (default per-step `"exact"` with input, else `"ignore"`). */
  readonly toolArgs?: ToolArgsMatchMode;
  /** Per-tool argument comparators, keyed by tool name — override the `toolArgs` mode for those tools. */
  readonly perTool?: Readonly<Record<string, (actual: JsonValue, reference: JsonValue) => boolean>>;
}

interface Call {
  readonly name: string;
  readonly input: JsonValue;
}

function callsOf(t: Trajectory): Call[] {
  return t.log.flatMap((e) => (e.type === "tool.call" ? [{ name: e.name, input: e.input }] : []));
}

function isObject(v: JsonValue): v is { readonly [k: string]: JsonValue } {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep structural equality over JSON values. */
function deepEqual(a: JsonValue, b: JsonValue): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => deepEqual(x, b[i] as JsonValue));
  }
  if (isObject(a) && isObject(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => k in b && deepEqual(a[k] as JsonValue, b[k] as JsonValue));
  }
  return false;
}

/** True when `sub` is structurally contained in `container` (objects by key, arrays by membership, else equal). */
function contains(container: JsonValue, sub: JsonValue): boolean {
  if (isObject(container) && isObject(sub)) {
    return Object.keys(sub).every((k) => k in container && contains(container[k] as JsonValue, sub[k] as JsonValue));
  }
  if (Array.isArray(container) && Array.isArray(sub)) {
    return sub.every((s) => container.some((c) => contains(c, s)));
  }
  return deepEqual(container, sub);
}

function argMatch(actualInput: JsonValue, ref: ReferenceStep, opts: MatchOptions): boolean {
  const per = opts.perTool?.[ref.tool];
  if (per !== undefined) return ref.input === undefined ? true : per(actualInput, ref.input);
  if (ref.input === undefined) return true;
  const mode: ToolArgsMatchMode = opts.toolArgs ?? "exact";
  switch (mode) {
    case "ignore":
      return true;
    case "exact":
      return deepEqual(actualInput, ref.input);
    case "subset":
      return contains(actualInput, ref.input);
    case "superset":
      return contains(ref.input, actualInput);
  }
}

function stepMatch(actual: Call, ref: ReferenceStep, opts: MatchOptions): boolean {
  return actual.name === ref.tool && argMatch(actual.input, ref, opts);
}

function matchStrict(actual: readonly Call[], reference: ReferenceTrajectory, opts: MatchOptions): boolean {
  return actual.length === reference.length && reference.every((ref, i) => stepMatch(actual[i] as Call, ref, opts));
}

function matchSuperset(actual: readonly Call[], reference: ReferenceTrajectory, opts: MatchOptions): boolean {
  let i = 0;
  for (const call of actual) if (i < reference.length && stepMatch(call, reference[i] as ReferenceStep, opts)) i++;
  return i === reference.length;
}

function matchUnordered(actual: readonly Call[], reference: ReferenceTrajectory, opts: MatchOptions): boolean {
  if (actual.length !== reference.length) return false;
  const remaining = [...actual];
  for (const ref of reference) {
    const idx = remaining.findIndex((c) => stepMatch(c, ref, opts));
    if (idx === -1) return false;
    remaining.splice(idx, 1);
  }
  return remaining.length === 0;
}

function matchSubset(actual: readonly Call[], reference: ReferenceTrajectory, opts: MatchOptions): boolean {
  return actual.every((call) => reference.some((ref) => stepMatch(call, ref, opts)));
}

function describeMismatch(actual: readonly Call[], reference: ReferenceTrajectory, mode: TrajectoryMatchMode): string {
  const exp = reference.map((r) => r.tool);
  const got = actual.map((c) => c.name);
  if (mode !== "subset" && exp.join(">") === got.join(">")) return `tool sequence matched but arguments did not (${mode})`;
  return `expected [${exp.join(" → ") || "none"}] (${mode}), got [${got.join(" → ") || "none"}]`;
}

/**
 * A {@link Scorer} that scores `1` when the run's `tool.call` sequence matches `reference` under `mode`, else `0`.
 *
 * @param reference - the pinned golden {@link ReferenceTrajectory} — a `{ tool, input? }[]` (pin one from a
 *   recorded run with {@link referenceFromTrajectory}).
 * @param opts - {@link MatchOptions}: the sequence `mode` (default `"superset"`), the `toolArgs` comparison, and
 *   optional `perTool` comparators.
 * @returns a {@link Scorer} named `trajectory:{mode}`; a mismatch is explained in the score's `rationale`.
 * @remarks A single assertion over ordering, presence, and arguments — the trajectory counterpart to text-output
 *   scorers like {@link outputMatches}. See {@link calledInOrder} for a name-only ordered check.
 * @example
 * ```ts
 * // The agent must search, then book Istanbul — extra calls allowed, args must match:
 * matchesTrajectory([{ tool: "search" }, { tool: "book", input: { city: "Istanbul" } }], { mode: "superset" });
 * ```
 */
export function matchesTrajectory(reference: ReferenceTrajectory, opts?: MatchOptions): Scorer {
  const mode: TrajectoryMatchMode = opts?.mode ?? "superset";
  const matchOpts: MatchOptions = opts ?? {};
  return (t) => {
    const actual = callsOf(t);
    const ok =
      mode === "strict"
        ? matchStrict(actual, reference, matchOpts)
        : mode === "unordered"
          ? matchUnordered(actual, reference, matchOpts)
          : mode === "subset"
            ? matchSubset(actual, reference, matchOpts)
            : matchSuperset(actual, reference, matchOpts);
    return { name: `trajectory:${mode}`, value: ok ? 1 : 0, ...(ok ? {} : { rationale: describeMismatch(actual, reference, mode) }) };
  };
}

/**
 * Derive a {@link ReferenceTrajectory} from a recorded {@link Trajectory} — its ordered `tool.call`s as
 * `{ tool, input }` steps. Turns a known-good run into a golden to feed {@link matchesTrajectory}.
 *
 * @param t - a recorded trajectory (from {@link runEval}, {@link loadTrajectory}, or a live run).
 * @returns the extracted reference sequence.
 */
export function referenceFromTrajectory(t: Trajectory): ReferenceTrajectory {
  return callsOf(t).map((c) => ({ tool: c.name, input: c.input }));
}
