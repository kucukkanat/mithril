import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link, useParams } from "react-router-dom";
import { createRunnerClient } from "@mithril/runner-web";
import { generateEvalRun, modelLabel, type EvalCaseSpec, type EvalSuiteSpec, type ModelSpec, type ScorerSpec } from "@mithril/spec";
import { htmlReport, referenceFromTrajectory, toSnapshot, type SuiteRun } from "@mithril/evals";
import { useProjectStore } from "../state/projectStore.ts";
import { envForModels, useSettingsStore } from "../state/settingsStore.ts";
import { nextCaseName } from "../lib/defaults.ts";
import { deleteReport, listReports, loadReport, newRunId, saveReport, type ReportListEntry } from "../lib/reports.ts";
import { pairwiseScript, type PairwisePair, type PairwiseVerdict } from "../lib/pairwise.ts";
import { TopBar } from "../components/TopBar.tsx";
import { ModelPicker } from "../components/ModelPicker.tsx";
import { ScorerEditor } from "../components/ScorerEditor.tsx";
import { EvalGrid } from "../components/EvalGrid.tsx";

/*
 * The evals workbench: author suites/cases, run them across a matrix of models (one runSuite streamed via
 * emit()), compare the results side by side, diff against a saved baseline, pin golden trajectories, and
 * A/B a pair of models with an LLM judge. One runner run per action; results persist as report history.
 */

const DEFAULT_MODEL: ModelSpec = { kind: "live", provider: "openai", model: "gpt-4o-mini" };

const isSuiteRun = (d: unknown): d is SuiteRun => typeof d === "object" && d !== null && "case" in d && "group" in d && "trajectory" in d;
const isPairwise = (d: unknown): d is PairwiseVerdict => typeof d === "object" && d !== null && (d as { kind?: unknown }).kind === "pairwise";
const uniqueInOrder = (xs: readonly string[]): string[] => [...new Set(xs)];

/** The judge models an `llmJudge` scorer references — their providers also need keys. */
function judgeModelsOf(suite: EvalSuiteSpec): ModelSpec[] {
  const out: ModelSpec[] = [];
  for (const c of suite.cases) for (const sc of c.scorers) {
    if (sc.type !== "llmJudge") continue;
    const m = (sc.params as { model?: unknown }).model;
    if (typeof m === "object" && m !== null && "kind" in m) out.push(m as ModelSpec);
  }
  return out;
}

function download(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "text/html" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function EvalsPage() {
  const { id } = useParams<{ id: string }>();
  const store = useProjectStore();
  const settings = useSettingsStore();

  const [suiteId, setSuiteId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  // Matrix rows carry a stable id so removing a model unmounts the RIGHT ModelPicker (its per-kind stash
  // doesn't leak onto a neighbor that shifted up). `models` is derived for all the run logic below.
  const [rows, setRows] = useState<readonly { readonly id: string; readonly spec: ModelSpec }[]>([{ id: crypto.randomUUID(), spec: DEFAULT_MODEL }]);
  const models = rows.map((r) => r.spec);
  const [results, setResults] = useState<readonly SuiteRun[]>([]);
  const [baselineRuns, setBaselineRuns] = useState<readonly SuiteRun[] | undefined>(undefined);
  const [baselineRunId, setBaselineRunId] = useState<string>("");
  const [reports, setReports] = useState<readonly ReportListEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "matrix" | "pairwise">("idle");
  const [abA, setAbA] = useState<string>("");
  const [abB, setAbB] = useState<string>("");
  const [judge, setJudge] = useState<ModelSpec>(DEFAULT_MODEL);
  const [rubric, setRubric] = useState("Which answer is more accurate and helpful?");
  const [pairwise, setPairwise] = useState<readonly PairwiseVerdict[]>([]);
  const lastStatus = useRef<string>("idle");

  useEffect(() => {
    if (id !== undefined && store.projectId !== id) void store.open(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (id !== undefined) void listReports(id).then(setReports);
  }, [id]);

  const client = useMemo(
    () => createRunnerClient(() => new Worker(new URL("../runner/worker-entry.ts", import.meta.url), { type: "module" })),
    [],
  );
  useEffect(() => () => client.stop(), [client]);
  const run = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);

  const spec = store.spec;
  const suites = spec?.evals ?? [];
  const suite = suites.find((s) => s.id === suiteId) ?? suites[0];

  // Seed the matrix from the entry agent's model whenever the project loads.
  const entryModelKey = spec?.decls.find((d) => d.kind === "agent" && d.id === spec.entry.target)?.id;
  useEffect(() => {
    if (spec === null) return;
    const entry = spec.decls.find((d) => d.kind === "agent" && d.id === spec.entry.target);
    if (entry?.kind === "agent") setRows([{ id: crypto.randomUUID(), spec: entry.model }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, entryModelKey]);

  // Auto-select a case so the editor is never blank when a suite has cases (e.g. after the
  // "Save as eval case" bridge, or the starter suite).
  const caseCount = suite?.cases.length ?? 0;
  useEffect(() => {
    if (caseCount > 0 && selectedCase === null) setSelectedCase(caseCount - 1);
    if (caseCount === 0 && selectedCase !== null) setSelectedCase(null);
  }, [suiteId, caseCount, selectedCase]);

  // Stream collected data off the runner as it arrives.
  useEffect(() => {
    if (phase === "matrix") setResults(run.data.filter(isSuiteRun));
    if (phase === "pairwise") setPairwise(run.data.filter(isPairwise));
  }, [run.data, phase]);

  // Finalize a run: persist the matrix report, or surface an error.
  useEffect(() => {
    if (run.status === lastStatus.current) return;
    lastStatus.current = run.status;
    if (run.status === "error") {
      setError(run.errorHint ?? run.error);
      setPhase("idle");
      return;
    }
    if (run.status === "done" && phase === "matrix" && suite !== undefined && id !== undefined) {
      const suiteRuns = run.data.filter(isSuiteRun);
      if (suiteRuns.length > 0) {
        void saveReport({ runId: newRunId(), projectId: id, suiteId: suite.id, suiteName: suite.name, createdAt: Date.now(), models: models.map(modelLabel), runs: suiteRuns }).then(() => listReports(id).then(setReports));
      }
      setPhase("idle");
    }
    if (run.status === "done" && phase === "pairwise") setPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.status]);

  if (spec === null || suite === undefined) {
    return (
      <div className="designer" data-testid="evals-page">
        <TopBar />
        <main className="project-list">
          {spec === null ? (
            <p className="hint">Loading project…</p>
          ) : (
            <section className="onboard" data-testid="evals-onboard">
              <div className="onboard-glyph" aria-hidden>🧪</div>
              <h1>Test your agent with evals</h1>
              <p className="onboard-sub">
                A <strong>suite</strong> is a set of test <strong>cases</strong> — each an input plus the checks it should pass. Run a suite across one or more models and compare the results side by side.
              </p>
              <div className="onboard-foot">
                <button className="primary" data-testid="evals-generate-suite" onClick={() => generateStarterSuite()}>Generate a starter suite</button>
                <button className="ghost" data-testid="evals-add-first-suite" onClick={() => addSuite()}>Start empty</button>
              </div>
              <p className="hint">Tip: run your agent, then hit “＋ Save as eval case” to turn a real run into a test.</p>
            </section>
          )}
        </main>
      </div>
    );
  }

  // Narrowed handles for the hoisted helpers below (control-flow narrowing doesn't reach their bodies).
  const activeSpec = spec;
  const activeSuite = suite;

  function mutateSuite(fn: (s: EvalSuiteSpec) => EvalSuiteSpec): void {
    store.updateSpec((sp) => ({ ...sp, evals: (sp.evals ?? []).map((su) => (su.id === activeSuite.id ? fn(su) : su)) }));
  }

  function addSuite(): void {
    const nid = `suite${(spec?.evals?.length ?? 0) + 1}`;
    store.updateSpec((sp) => ({ ...sp, evals: [...(sp.evals ?? []), { id: nid, name: "New suite", threshold: 1, cases: [] }] }));
    setSuiteId(nid);
  }

  // Build a runnable first suite from the project's entry input, so "evals" starts as something real.
  function generateStarterSuite(): void {
    const sp = store.spec;
    if (sp === null) return;
    const input = typeof sp.entry.input === "string" ? sp.entry.input : sp.entry.input.filter((m) => m.role === "user");
    const nid = `suite${(sp.evals?.length ?? 0) + 1}`;
    store.updateSpec((s) => ({
      ...s,
      evals: [...(s.evals ?? []), { id: nid, name: "Starter suite", threshold: 1, cases: [{ name: nextCaseName(new Set()), input, scorers: [{ type: "completed", params: {} }] }] }],
    }));
    setSuiteId(nid);
    setSelectedCase(0);
  }

  function addCase(): void {
    const name = nextCaseName(new Set(activeSuite.cases.map((c) => c.name)));
    mutateSuite((s) => ({ ...s, cases: [...s.cases, { name, input: "", scorers: [{ type: "completed", params: {} }] }] }));
    setSelectedCase(activeSuite.cases.length);
  }

  function updateCase(i: number, fn: (c: EvalCaseSpec) => EvalCaseSpec): void {
    mutateSuite((s) => ({ ...s, cases: s.cases.map((c, j) => (j === i ? fn(c) : c)) }));
  }

  function removeCase(i: number): void {
    if (!window.confirm(`Delete "${activeSuite.cases[i]?.name ?? "this case"}"? This can't be undone.`)) return;
    mutateSuite((s) => ({ ...s, cases: s.cases.filter((_, j) => j !== i) }));
    setSelectedCase(null);
  }

  const columns = results.length > 0 ? uniqueInOrder(results.map((r) => r.group)) : models.map(modelLabel);
  const caseNames = suite.cases.map((c) => c.name);
  const running = run.status === "running";
  const missingModel = models.length === 0;

  function runMatrix(): void {
    if (models.length === 0) {
      setError("Add at least one model to the matrix.");
      return;
    }
    const { env, missing } = envForModels([...models, ...judgeModelsOf(activeSuite)], settings.keys);
    if (missing.length > 0) {
      setError(`Missing API key${missing.length > 1 ? "s" : ""} for ${missing.join(", ")} — add ${missing.length > 1 ? "them" : "it"} in Settings.`);
      return;
    }
    let code: string;
    try {
      code = generateEvalRun(activeSpec, { suiteId: activeSuite.id, models });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    setError(null);
    setResults([]);
    setPairwise([]);
    setPhase("matrix");
    const anyLocal = models.some((m) => m.kind === "local");
    client.run(code, { env, idleTimeoutMs: anyLocal ? null : 120_000, timeoutMessage: "Eval run timed out." });
  }

  function runPairwise(): void {
    if (abA === "" || abB === "" || abA === abB) {
      setError("Pick two different models to compare.");
      return;
    }
    const pairs: PairwisePair[] = activeSuite.cases.flatMap((c) => {
      const a = results.find((r) => r.group === abA && r.case === c.name);
      const b = results.find((r) => r.group === abB && r.case === c.name);
      return a !== undefined && b !== undefined ? [{ name: c.name, a: a.trajectory, b: b.trajectory }] : [];
    });
    if (pairs.length === 0) {
      setError("Run the matrix first so both models have trajectories.");
      return;
    }
    const { env, missing } = envForModels([judge], settings.keys);
    if (missing.length > 0) {
      setError(`Missing API key for the judge (${missing.join(", ")}).`);
      return;
    }
    setError(null);
    setPairwise([]);
    setPhase("pairwise");
    client.run(pairwiseScript(pairs, judge, rubric), { env, idleTimeoutMs: judge.kind === "local" ? null : 120_000 });
  }

  function exportReport(): void {
    const entries = results.map((r) => ({ run: r, group: r.group, durationMs: r.durationMs }));
    const html = htmlReport(entries, { title: `${activeSpec.name} — ${activeSuite.name}`, ...(baselineRuns !== undefined ? { baseline: toSnapshot([...baselineRuns]) } : {}) });
    download(html, `${activeSuite.id}-report.html`);
  }

  async function selectBaseline(runId: string): Promise<void> {
    setBaselineRunId(runId);
    if (runId === "" || id === undefined) {
      setBaselineRuns(undefined);
      return;
    }
    const rec = await loadReport(id, runId);
    setBaselineRuns(rec?.runs);
  }

  async function openReport(runId: string): Promise<void> {
    if (id === undefined) return;
    const rec = await loadReport(id, runId);
    if (rec === undefined) return;
    setSuiteId(rec.suiteId);
    setSelectedCase(null); // opened suite may have fewer cases than the stale index — let auto-select repick
    setResults(rec.runs);
    setPhase("idle");
  }

  function pinGolden(caseName: string, runObj: SuiteRun): void {
    const reference = referenceFromTrajectory(runObj.trajectory);
    mutateSuite((s) => ({
      ...s,
      cases: s.cases.map((c) =>
        c.name !== caseName
          ? c
          : {
              ...c,
              reference,
              scorers: c.scorers.some((sc) => sc.type === "matchesTrajectory") ? c.scorers : [...c.scorers, { type: "matchesTrajectory", params: { mode: "superset" } }],
            },
      ),
    }));
  }

  const activeCase = selectedCase !== null ? suite.cases[selectedCase] : undefined;

  return (
    <div className="designer" data-testid="evals-page">
      <TopBar />
      <div className="designer-body">
        {/* ── rail: suites + cases ── */}
        <aside className="decl-list" data-testid="evals-rail">
          <label>
            Suite
            <select data-testid="evals-suite-select" value={suite.id} onChange={(e) => { setSuiteId(e.target.value); setSelectedCase(null); setResults([]); setPairwise([]); setAbA(""); setAbB(""); }}>
              {suites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <div className="decl-actions">
            <button className="ghost" data-testid="evals-add-suite" onClick={addSuite}>+ Suite</button>
            <button className="ghost" data-testid="evals-add-case" onClick={addCase}>+ Case</button>
          </div>
          <input
            className="mono"
            data-testid="evals-suite-name"
            value={suite.name}
            aria-label="Suite name"
            onChange={(e) => mutateSuite((s) => ({ ...s, name: e.target.value }))}
          />
          <ul data-testid="evals-case-list">
            {suite.cases.map((c, i) => (
              <li key={i} className={selectedCase === i ? "sel" : ""}>
                <button className="decl" data-testid={`evals-case-${i}`} onClick={() => setSelectedCase(i)}>
                  <span className="decl-kind k-tool">case</span>
                  {c.name}
                </button>
                <button className="decl-del" data-testid={`evals-case-remove-${i}`} onClick={() => removeCase(i)} title="Remove case">✕</button>
              </li>
            ))}
            {suite.cases.length === 0 && <li className="hint">No cases yet — add one.</li>}
          </ul>
        </aside>

        <main className="evals-main" data-testid="evals-main">
          {/* ── run toolbar ── */}
          <section className="panel" data-testid="evals-toolbar">
            <h3>Models to test</h3>
            <div className="model-matrix" data-testid="model-matrix">
              {rows.map((r, i) => (
                <div className="matrix-model" key={r.id} data-testid={`matrix-model-${i}`}>
                  <ModelPicker value={r.spec} onChange={(next) => setRows(rows.map((x) => (x.id === r.id ? { ...x, spec: next } : x)))} />
                  <button className="ghost danger" data-testid={`matrix-model-remove-${i}`} onClick={() => setRows(rows.filter((x) => x.id !== r.id))} title="Remove model">✕</button>
                </div>
              ))}
              <button className="ghost" data-testid="matrix-add-model" onClick={() => setRows([...rows, { id: crypto.randomUUID(), spec: DEFAULT_MODEL }])}>+ Add model</button>
            </div>
            <div className="run-actions">
              <button className="primary" data-testid="evals-run" onClick={runMatrix} disabled={running || missingModel || suite.cases.length === 0}>
                {running && phase === "matrix" ? "Running…" : "▶ Run matrix"}
              </button>
              {running && <button className="ghost" data-testid="evals-stop" onClick={() => { client.stop(); setPhase("idle"); }}>Stop</button>}
              <button className="ghost" data-testid="evals-export" onClick={exportReport} disabled={results.length === 0}>⤓ Export HTML</button>
              <label className="inline">
                Baseline
                <select data-testid="evals-baseline" value={baselineRunId} onChange={(e) => void selectBaseline(e.target.value)}>
                  <option value="">none</option>
                  {reports.map((r) => (
                    <option key={r.runId} value={r.runId}>{new Date(r.createdAt).toLocaleString()} · {r.passed}/{r.total}</option>
                  ))}
                </select>
              </label>
              <span className={`status status-${run.status}`} data-testid="evals-status">{phase !== "idle" ? phase : run.status}</span>
            </div>
            {!running && (missingModel || suite.cases.length === 0) && (
              <p className="hint" data-testid="evals-run-hint">
                {missingModel ? "Add a model to the matrix to run." : "Add a case to this suite to run — or hit “Generate a starter suite”."}
              </p>
            )}
            {reports.length > 0 && (
              <p className="hint">Pick a <strong>Baseline</strong> to diff this run against a saved one — improved ▲ / regressed ▼ cases are badged in the grid.</p>
            )}
            {error !== null && <p className="warn" data-testid="evals-error">{error}</p>}
            {run.download !== null && run.download.progress < 1 && (
              <div className="download" data-testid="evals-download">
                <span>Downloading model weights… {Math.round(run.download.progress * 100)}%</span>
                <progress value={run.download.progress} max={1} />
              </div>
            )}
          </section>

          {/* ── case editor ── */}
          {activeCase !== undefined && selectedCase !== null && (
            <section className="panel" data-testid="evals-case-editor">
              <h3>Case</h3>
              <label>
                Name
                <input data-testid="case-name" value={activeCase.name} onChange={(e) => updateCase(selectedCase, (c) => ({ ...c, name: e.target.value }))} />
              </label>
              {typeof activeCase.input === "string" ? (
                <label>
                  Input
                  <textarea rows={2} data-testid="case-input" value={activeCase.input} onChange={(e) => updateCase(selectedCase, (c) => ({ ...c, input: e.target.value }))} />
                </label>
              ) : (
                <p className="hint">This case's input is a chat history — edit it in the code view.</p>
              )}
              <h4>Scorers</h4>
              {activeCase.reference !== undefined && <p className="hint" data-testid="case-golden">⭑ Golden reference pinned ({activeCase.reference.length} step{activeCase.reference.length === 1 ? "" : "s"}).</p>}
              <div className="scorer-list">
                {activeCase.scorers.map((sc, i) => (
                  <ScorerEditor
                    key={i}
                    scorer={sc}
                    warning={sc.type === "matchesTrajectory" && activeCase.reference === undefined ? "Needs a golden first — run the matrix, open a cell, then “⭑ Pin as golden”." : undefined}
                    onChange={(next) => updateCase(selectedCase, (c) => ({ ...c, scorers: c.scorers.map((x, j) => (j === i ? next : x)) }))}
                    onRemove={() => updateCase(selectedCase, (c) => ({ ...c, scorers: c.scorers.filter((_, j) => j !== i) }))}
                  />
                ))}
              </div>
              <button className="ghost" data-testid="case-add-scorer" onClick={() => updateCase(selectedCase, (c) => ({ ...c, scorers: [...c.scorers, { type: "completed", params: {} } as ScorerSpec] }))}>+ Add scorer</button>
            </section>
          )}

          {/* ── results grid ── */}
          {results.length > 0 && baselineRuns !== undefined && (
            <p className="hint delta-legend" data-testid="delta-legend">
              <span className="grid-delta improved">▲</span> improved · <span className="grid-delta regressed">▼</span> regressed — vs the selected baseline. Click any cell to inspect its run.
            </p>
          )}
          {(results.length > 0 || running) && (
            <EvalGrid cases={caseNames} models={columns} runs={results} baseline={baselineRuns} onPinGolden={pinGolden} />
          )}

          {/* ── A/B pairwise ── */}
          {results.length > 0 && columns.length < 2 && (
            <p className="hint" data-testid="evals-ab-teaser">Add a 2nd model to the matrix to A/B two answers with an LLM judge.</p>
          )}
          {columns.length >= 2 && results.length > 0 && (
            <section className="panel" data-testid="evals-ab">
              <h3>A/B judge</h3>
              <div className="ab-controls">
                <label className="inline">A
                  <select data-testid="ab-a" value={abA} onChange={(e) => setAbA(e.target.value)}>
                    <option value="">choose…</option>
                    {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="inline">B
                  <select data-testid="ab-b" value={abB} onChange={(e) => setAbB(e.target.value)}>
                    <option value="">choose…</option>
                    {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <button className="primary" data-testid="ab-run" onClick={runPairwise} disabled={running}>{running && phase === "pairwise" ? "Judging…" : "Judge A vs B"}</button>
              </div>
              <label>Rubric<input data-testid="ab-rubric" value={rubric} onChange={(e) => setRubric(e.target.value)} /></label>
              <div className="ab-judge">
                <span className="hint">Judge model</span>
                <ModelPicker value={judge} onChange={setJudge} />
              </div>
              {pairwise.length > 0 && (
                <div className="ab-results" data-testid="ab-results">
                  {pairwise.map((v, i) => (
                    <div key={i} className="ab-row">
                      <span className="mono">{v.case}</span>
                      <span className={`grid-badge ${v.value > 0.5 ? "ok" : v.value < 0.5 ? "no" : ""}`}>{v.value > 0.5 ? `A (${abA})` : v.value < 0.5 ? `B (${abB})` : "tie"}</span>
                      {v.rationale !== undefined && <span className="hint">{v.rationale}</span>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── history ── */}
          {reports.length > 0 && (
            <section className="panel" data-testid="evals-history">
              <h3>Run history</h3>
              <ul className="report-list">
                {reports.map((r) => (
                  <li key={r.runId} data-testid={`report-${r.runId}`}>
                    <button className="ghost" onClick={() => void openReport(r.runId)}>{new Date(r.createdAt).toLocaleString()}</button>
                    <span className="hint">{r.suiteName} · {r.models.length} model{r.models.length === 1 ? "" : "s"} · {r.passed}/{r.total} passed</span>
                    <button className="decl-del" data-testid={`report-delete-${r.runId}`} onClick={() => { if (id !== undefined && window.confirm("Delete this saved report? It can't be recovered.")) void deleteReport(id, r.runId).then(() => listReports(id).then(setReports)); }} title="Delete report">✕</button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {run.status === "error" && run.error !== null && (
            <div className="error-box" data-testid="evals-run-error">
              {run.errorHint !== null && <p>{run.errorHint}</p>}
              <details><summary>Raw error</summary><pre>{run.error}</pre></details>
            </div>
          )}
          {settings.keys && <p className="hint">Live models send your key to their provider. Manage keys in <Link to="/settings">Settings</Link>.</p>}
        </main>
      </div>
    </div>
  );
}
