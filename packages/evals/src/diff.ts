/**
 * Baseline diffing: compress a run's {@link EvalRun}s into a small, serializable {@link RunSnapshot}, then
 * compare two snapshots to see what got better or worse — the regression-gate primitive behind CI baselines
 * and the `htmlReport` diff view. Pure and zero-dependency.
 *
 * @packageDocumentation
 */

import type { EvalRun } from "./index.ts";

/** A per-case row in a {@link RunSnapshot}: enough to detect a pass↔fail flip without the full trajectory. */
export interface EvalRunSummary {
  readonly case: string;
  /** The run's group label (e.g. the model id), when it came from a {@link runSuite} matrix. */
  readonly group?: string;
  readonly passed: boolean;
  readonly scores: readonly { readonly name: string; readonly value: number }[];
}

/** A compact, JSON-serializable snapshot of a whole eval run — persist it as a baseline to diff against later. */
export interface RunSnapshot {
  readonly generatedAt: string;
  readonly runs: readonly EvalRunSummary[];
}

/** The four-way outcome of {@link diffRuns}, each a list of case keys. */
export interface RunDiff {
  /** Keys that flipped fail → pass. */
  readonly improved: readonly string[];
  /** Keys that flipped pass → fail. */
  readonly regressed: readonly string[];
  /** Keys present only in `current`. */
  readonly added: readonly string[];
  /** Keys present only in `baseline`. */
  readonly removed: readonly string[];
}

/** The stable identity of a summarized run: `group::case` when grouped, else `case`. Keep in sync with reports. */
export function summaryKey(s: { readonly case: string; readonly group?: string }): string {
  return s.group !== undefined && s.group !== "" ? `${s.group}::${s.case}` : s.case;
}

function hasStringGroup(r: EvalRun): r is EvalRun & { readonly group: string } {
  return typeof (r as { readonly group?: unknown }).group === "string";
}

/**
 * Compress {@link EvalRun}s (or {@link SuiteRun}s) into a {@link RunSnapshot} of per-case pass/fail + scores.
 *
 * @param runs - the runs to summarize; a {@link SuiteRun}'s `group` is carried onto its summary.
 * @param opts - `generatedAt` overrides the ISO timestamp (pass one for reproducible output).
 * @returns a {@link RunSnapshot} suitable for persisting as a baseline.
 */
export function toSnapshot(runs: readonly EvalRun[], opts?: { readonly generatedAt?: string }): RunSnapshot {
  return {
    generatedAt: opts?.generatedAt ?? new Date().toISOString(),
    runs: runs.map((r) => ({
      case: r.case,
      ...(hasStringGroup(r) ? { group: r.group } : {}),
      passed: r.passed,
      scores: r.scores.map((s) => ({ name: s.name, value: s.value })),
    })),
  };
}

/**
 * Diff two {@link RunSnapshot}s by case key, classifying each as improved / regressed / added / removed.
 *
 * @param baseline - the reference snapshot (e.g. a pinned previous run).
 * @param current - the new snapshot to judge against the baseline.
 * @returns a {@link RunDiff}; `regressed` being non-empty is the signal a CI gate should fail on.
 * @example
 * ```ts
 * const { regressed } = diffRuns(baseline, toSnapshot(runs));
 * if (regressed.length > 0) process.exitCode = 1;
 * ```
 */
export function diffRuns(baseline: RunSnapshot, current: RunSnapshot): RunDiff {
  const base = new Map(baseline.runs.map((r) => [summaryKey(r), r.passed]));
  const seen = new Set<string>();
  const improved: string[] = [];
  const regressed: string[] = [];
  const added: string[] = [];
  for (const r of current.runs) {
    const key = summaryKey(r);
    seen.add(key);
    const was = base.get(key);
    if (was === undefined) added.push(key);
    else if (!was && r.passed) improved.push(key);
    else if (was && !r.passed) regressed.push(key);
  }
  const removed = [...base.keys()].filter((k) => !seen.has(k));
  return { improved, regressed, added, removed };
}
