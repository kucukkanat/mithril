import { useState } from "react";
import { RunInspector } from "@mithril/devtools/ui";
import type { SuiteRun } from "@mithril/evals";

/*
 * The side-by-side results matrix: cases down, models across. Each cell is a pass/fail summary that
 * expands to the case's per-scorer scores and a full devtools RunInspector over its trajectory. With a
 * baseline, cells are badged improved / regressed / new.
 */

export interface EvalGridProps {
  readonly cases: readonly string[];
  readonly models: readonly string[];
  readonly runs: readonly SuiteRun[];
  readonly baseline?: readonly SuiteRun[] | undefined;
  readonly onPinGolden?: ((caseName: string, run: SuiteRun) => void) | undefined;
}

type Delta = "improved" | "regressed" | "new" | undefined;

const find = (runs: readonly SuiteRun[], model: string, name: string): SuiteRun | undefined => runs.find((r) => r.group === model && r.case === name);

function deltaOf(run: SuiteRun | undefined, base: SuiteRun | undefined): Delta {
  if (run === undefined) return undefined;
  // deltaOf is only called when a baseline is selected, so a missing base cell means this run is NEW vs it.
  if (base === undefined) return "new";
  if (!base.passed && run.passed) return "improved";
  if (base.passed && !run.passed) return "regressed";
  return undefined;
}

const DELTA_LABEL: Record<Exclude<Delta, undefined>, string> = { improved: "▲", regressed: "▼", new: "＋" };

export function EvalGrid({ cases, models, runs, baseline, onPinGolden }: EvalGridProps) {
  const [open, setOpen] = useState<{ readonly model: string; readonly name: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "fail" | "pass">("all");
  const openRun = open === null ? undefined : find(runs, open.model, open.name);

  const passRate = (model: string): string => {
    const cells = cases.map((c) => find(runs, model, c)).filter((r): r is SuiteRun => r !== undefined);
    const passed = cells.filter((r) => r.passed).length;
    return cells.length === 0 ? "—" : `${passed}/${cells.length}`;
  };

  // Filter rows by outcome so "show me what broke" is one click.
  const rowCells = (name: string): SuiteRun[] => models.map((m) => find(runs, m, name)).filter((r): r is SuiteRun => r !== undefined);
  const shownCases = cases.filter((name) => {
    if (filter === "all") return true;
    const cells = rowCells(name);
    if (cells.length === 0) return false;
    return filter === "fail" ? cells.some((r) => !r.passed) : cells.every((r) => r.passed);
  });
  const failCount = cases.filter((name) => rowCells(name).some((r) => !r.passed)).length;

  return (
    <div className="eval-grid-wrap" data-testid="eval-grid">
      {runs.length > 0 && (
        <div className="grid-filter" data-testid="grid-filter">
          <div className="seg">
            <button className={filter === "all" ? "seg-on" : ""} data-testid="grid-filter-all" onClick={() => setFilter("all")}>All ({cases.length})</button>
            <button className={filter === "fail" ? "seg-on" : ""} data-testid="grid-filter-fail" onClick={() => setFilter("fail")}>Failures ({failCount})</button>
            <button className={filter === "pass" ? "seg-on" : ""} data-testid="grid-filter-pass" onClick={() => setFilter("pass")}>Passes</button>
          </div>
        </div>
      )}
      <div className="eval-grid-scroll">
        <table className="eval-grid">
          <thead>
            <tr>
              <th className="corner">Case</th>
              {models.map((m) => (
                <th key={m} title={m}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shownCases.length === 0 && (
              <tr><td className="cell-empty" colSpan={models.length + 1}>No {filter === "fail" ? "failing" : "passing"} cases.</td></tr>
            )}
            {shownCases.map((name) => (
              <tr key={name}>
                <th className="case-name" scope="row">{name}</th>
                {models.map((model) => {
                  const run = find(runs, model, name);
                  const delta = baseline === undefined ? undefined : deltaOf(run, find(baseline, model, name));
                  const isOpen = open?.model === model && open?.name === name;
                  if (run === undefined) return <td key={model} className="cell cell-empty" data-testid={`cell-${model}-${name}`}>—</td>;
                  const passedScores = run.scores.filter((s) => s.value >= 1).length;
                  return (
                    <td key={model} className={`cell${isOpen ? " cell-open" : ""}${delta === "regressed" ? " cell-regressed" : ""}`} data-testid={`cell-${model}-${name}`}>
                      <button className="cell-btn" onClick={() => setOpen(isOpen ? null : { model, name })} title={`status: ${run.trajectory.final.status}`}>
                        <span className={`grid-badge ${run.passed ? "ok" : "no"}`}>{run.passed ? "PASS" : "FAIL"}</span>
                        <span className="cell-scores">{passedScores}/{run.scores.length}</span>
                        {delta !== undefined && <span className={`grid-delta ${delta}`}>{DELTA_LABEL[delta]}</span>}
                        <span className="cell-dur">{Math.round(run.durationMs)}ms</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="grid-summary">
              <th scope="row">pass rate</th>
              {models.map((m) => (
                <td key={m} data-testid={`passrate-${m}`}>{passRate(m)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {open !== null && openRun !== undefined && (
        <section className="cell-detail panel" data-testid="cell-detail">
          <div className="cell-detail-head">
            <h3>{open.name} · <span className="grp">{open.model}</span></h3>
            <div className="cell-detail-actions">
              {onPinGolden !== undefined && (
                <button className="ghost" data-testid="pin-golden" onClick={() => onPinGolden(open.name, openRun)} title="Save this run's tool calls as the case's golden reference">
                  ⭑ Pin as golden
                </button>
              )}
              <button className="ghost" onClick={() => setOpen(null)}>Close</button>
            </div>
          </div>
          <div className="scores-list" data-testid="cell-scores">
            {openRun.scores.map((s, i) => (
              <div key={i} className={`score-row ${s.value >= 1 ? "ok" : s.value > 0 ? "partial" : "no"}`}>
                <span className="mono">{s.name}</span>
                <span className="mono sval">{s.value}</span>
                {s.rationale !== undefined && <span className="hint">{s.rationale}</span>}
              </div>
            ))}
          </div>
          <RunInspector events={openRun.trajectory.log} />
        </section>
      )}
    </div>
  );
}
