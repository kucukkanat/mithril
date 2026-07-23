/**
 * Render {@link EvalRun}s into a **self-contained, single-file HTML report** — summary stats plus a
 * filterable, searchable list of cases with their scores, output, and tool calls. No runtime deps, no
 * network: the returned string is a complete HTML document you can write to disk and open in a browser.
 *
 * @packageDocumentation
 */

/// <reference types="bun-types" />
import type { EvalRun, Score } from "./index.ts";
import { summaryKey } from "./diff.ts";
import type { RunSnapshot } from "./diff.ts";
import type { MithrilEvent } from "@mithril/core/protocol";

/**
 * One row of an HTML report: an {@link EvalRun} plus optional presentation metadata.
 *
 * @remarks `group` labels the row (e.g. the model id) and drives the group filter; `durationMs` is shown
 * per row and summed in the header. Map each `runEval` result into one of these.
 */
export interface EvalReportEntry {
  readonly run: EvalRun;
  /** A grouping label shown as a column and offered in the group filter — typically the model id. */
  readonly group?: string;
  /** Wall-clock time for the case, in milliseconds (shown per row and summed). */
  readonly durationMs?: number;
}

/** Options for {@link htmlReport}. */
export interface HtmlReportOptions {
  /** Document title and page heading (default `"Mithril eval report"`). */
  readonly title?: string;
  /** ISO timestamp shown in the header (default: now). Pass one for reproducible output. */
  readonly generatedAt?: string;
  /**
   * A baseline {@link RunSnapshot} to diff against. When present, each row is badged improved / regressed /
   * new, regressions sort to the top, and a "changes" filter appears — turning the report into a
   * regression view.
   */
  readonly baseline?: RunSnapshot;
}

/** Options for {@link inspectorReport} — {@link HtmlReportOptions} plus the inspector's context window. */
export interface InspectorReportOptions extends HtmlReportOptions {
  /**
   * The model context window in tokens, used to draw each row inspector's context-fill bar. Omit it and the
   * meters still show tokens / cost / steps, just without the `% ctx` bar.
   */
  readonly contextWindow?: number;
}

// ── extraction (pure over the trajectory) ────────────────────────────────────────────────────────────────

interface ToolCall {
  readonly name: string;
  readonly input: unknown;
}

/** The concatenated assistant text of a run (its `text.delta` stream). */
function outputText(log: readonly MithrilEvent[]): string {
  return log
    .filter((e) => e.type === "text.delta")
    .map((e) => (e as unknown as { delta: string }).delta)
    .join("");
}

function toolCalls(log: readonly MithrilEvent[]): ToolCall[] {
  return log
    .filter((e) => e.type === "tool.call")
    .map((e) => {
      const c = e as unknown as { name: string; input: unknown };
      return { name: c.name, input: c.input };
    });
}

/** How a row compares to the baseline, when {@link HtmlReportOptions.baseline} is supplied. */
type DeltaKind = "improved" | "regressed" | "new" | "same";

interface RowData {
  readonly group: string;
  readonly name: string;
  readonly passed: boolean;
  readonly status: string;
  readonly scores: readonly Score[];
  readonly text: string;
  readonly tools: readonly ToolCall[];
  readonly costMicroUsd: number;
  readonly events: number;
  readonly durationMs: number | undefined;
  /** Baseline comparison, set only in diff mode. */
  readonly delta?: DeltaKind;
}

function toRow(entry: EvalReportEntry): RowData {
  const { run } = entry;
  const final = run.trajectory.final as { status: string; usage?: { costMicroUsd?: number } };
  return {
    group: entry.group ?? "",
    name: run.case,
    passed: run.passed,
    status: final.status,
    scores: run.scores,
    text: outputText(run.trajectory.log),
    tools: toolCalls(run.trajectory.log),
    costMicroUsd: final.usage?.costMicroUsd ?? 0,
    events: run.trajectory.log.length,
    durationMs: entry.durationMs,
  };
}

// ── html rendering ───────────────────────────────────────────────────────────────────────────────────────

/** HTML-escape text so untrusted output/tool payloads can never break the document or inject markup. */
function esc(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"));
}

const dollars = (microUsd: number): string => `$${(microUsd / 1e6).toFixed(6)}`;

function scoreClass(s: Score): string {
  return s.value >= 1 ? "ok" : s.value > 0 ? "partial" : "no";
}

// Shared row fragments so the static ({@link renderRow}) and inspector ({@link renderInspectorRow}) rows stay
// in lockstep on their filter metadata, summary, and score list.
function searchIndex(r: RowData): string {
  return esc([r.group, r.name, r.status, r.text, ...r.tools.map((t) => `${t.name} ${JSON.stringify(t.input)}`), ...r.scores.map((s) => s.name)].join(" ").toLowerCase());
}
function scorePills(r: RowData): string {
  return r.scores.map((s) => `<span class="pill ${scoreClass(s)}" title="${esc(s.rationale ?? "")}">${esc(s.name)} ${esc(s.value)}</span>`).join("");
}
function scoreRows(r: RowData): string {
  return r.scores.map((s) => `<div class="score ${scoreClass(s)}"><span class="sname">${esc(s.name)}</span><span class="sval">${esc(s.value)}</span>${s.rationale ? `<span class="srat">${esc(s.rationale)}</span>` : ""}</div>`).join("");
}
const usageLine = (r: RowData): string => `<div class="usage">status <b>${esc(r.status)}</b> · ${esc(r.events)} events · ${esc(dollars(r.costMicroUsd))}</div>`;

const DELTA_LABELS: Readonly<Record<Exclude<DeltaKind, "same">, string>> = { improved: "▲ IMPROVED", regressed: "▼ REGRESSED", new: "NEW" };
function deltaBadge(delta: DeltaKind | undefined): string {
  return delta === undefined || delta === "same" ? "" : `<span class="delta ${delta}">${DELTA_LABELS[delta]}</span>`;
}

// The `<details>` open tag (carrying the filter/search metadata) + the `<summary>` — identical for both row kinds.
function rowShell(r: RowData): { readonly open: string; readonly summary: string } {
  const dur = r.durationMs !== undefined ? `<span class="dur">${esc(Math.round(r.durationMs))} ms</span>` : "";
  const grp = r.group ? `<span class="grp">${esc(r.group)}</span>` : "";
  return {
    open: `<details class="row" data-status="${r.passed ? "pass" : "fail"}" data-group="${esc(r.group)}" data-delta="${r.delta ?? ""}" data-search="${searchIndex(r)}">`,
    summary: `<summary>
    <span class="badge ${r.passed ? "ok" : "no"}">${r.passed ? "PASS" : "FAIL"}</span>
    ${deltaBadge(r.delta)}${grp}<span class="name">${esc(r.name)}</span>
    <span class="pills">${scorePills(r)}</span>
    ${dur}
  </summary>`,
  };
}

function renderRow(r: RowData): string {
  const { open, summary } = rowShell(r);
  const toolsBlock = r.tools.length
    ? `<div class="sec"><h4>Tool calls</h4>${r.tools.map((t) => `<pre class="tool">${esc(t.name)}(${esc(JSON.stringify(t.input))})</pre>`).join("")}</div>`
    : "";
  const outBlock = r.text.trim() ? `<div class="sec"><h4>Output</h4><pre class="out">${esc(r.text)}</pre></div>` : "";
  return `${open}
  ${summary}
  <div class="detail">
    <div class="scores">${scoreRows(r)}</div>
    ${outBlock}${toolsBlock}
    ${usageLine(r)}
  </div>
</details>`;
}

// One row whose detail hosts a live `@mithril/devtools` inspector: the case's full event log is embedded as
// inert JSON (every `<` escaped to `<`, so model output can never break out of the `<script>`), and the
// bundled client (inspector-client.ts) lazily mounts the inspector into `.mth-inspect` when the row opens.
function renderInspectorRow(r: RowData, log: readonly MithrilEvent[], contextWindow: number | undefined): string {
  const { open, summary } = rowShell(r);
  const traj = JSON.stringify(log).replace(/</g, "\\u003c");
  const cwAttr = contextWindow !== undefined ? ` data-context-window="${esc(contextWindow)}"` : "";
  return `${open}
  ${summary}
  <div class="detail">
    <div class="scores">${scoreRows(r)}</div>
    <script type="application/json" class="mth-traj">${traj}</script>
    <div class="mth-inspect"${cwAttr}></div>
    ${usageLine(r)}
  </div>
</details>`;
}

const STYLE = `
:root{color-scheme:dark light;--bg:#0b0d11;--panel:#12151b;--panel2:#171b23;--bd:#252b36;--bd2:#333b49;--tx:#e6e9ef;--mut:#9aa4b2;--faint:#697084;--acc:#6ad0e0;--ok:#5bd6a4;--no:#f2688a;--warn:#e8b26a;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;--sans:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
@media (prefers-color-scheme:light){:root{--bg:#f6f7f9;--panel:#fff;--panel2:#f0f2f5;--bd:#dfe3ea;--bd2:#c7cdd8;--tx:#1a1e26;--mut:#57606f;--faint:#8b94a3;--acc:#0a7d92;--ok:#0a8f5e;--no:#c23a5c;--warn:#a8730f}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font-family:var(--sans);font-size:14px;line-height:1.5}
.wrap{max-width:1100px;margin:0 auto;padding:24px 20px 64px}
header{position:sticky;top:0;z-index:5;background:linear-gradient(var(--bg),var(--bg) 78%,transparent);padding-top:8px}
h1{margin:0 0 2px;font-size:20px;letter-spacing:-.01em}
.meta{color:var(--faint);font-family:var(--mono);font-size:12px;margin-bottom:14px}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.stat{background:var(--panel);border:1px solid var(--bd);border-radius:10px;padding:8px 12px;font-size:13px}
.stat b{font-size:16px}
.stat.pass b{color:var(--ok)} .stat.fail b{color:var(--no)}
.controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 0;border-bottom:1px solid var(--bd)}
#q{flex:1;min-width:180px;background:var(--panel2);border:1px solid var(--bd);border-radius:8px;color:var(--tx);padding:8px 12px;font:inherit}
#q:focus{outline:2px solid var(--acc);outline-offset:-1px}
.filters{display:inline-flex;gap:2px;background:var(--panel2);border:1px solid var(--bd);border-radius:8px;padding:3px}
.filters button{background:transparent;border:0;color:var(--mut);border-radius:6px;padding:5px 12px;cursor:pointer;font:inherit}
.filters button.active{background:var(--acc);color:#00171d;font-weight:600}
select{background:var(--panel2);border:1px solid var(--bd);border-radius:8px;color:var(--tx);padding:7px 10px;font:inherit}
#count{color:var(--faint);font-family:var(--mono);font-size:12px;margin-left:auto}
main{margin-top:6px}
.row{border:1px solid var(--bd);border-radius:10px;margin-top:8px;background:var(--panel);overflow:hidden}
.row[open]{border-color:var(--bd2)}
summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:11px 14px}
summary::-webkit-details-marker{display:none}
summary:hover{background:var(--panel2)}
.badge{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.06em;padding:3px 7px;border-radius:5px}
.badge.ok{color:var(--ok);background:color-mix(in srgb,var(--ok) 15%,transparent)}
.badge.no{color:var(--no);background:color-mix(in srgb,var(--no) 15%,transparent)}
.grp{font-family:var(--mono);font-size:11px;color:var(--acc);background:color-mix(in srgb,var(--acc) 12%,transparent);padding:2px 7px;border-radius:5px;white-space:nowrap}
.delta{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.05em;padding:2px 6px;border-radius:5px;white-space:nowrap}
.delta.improved{color:var(--ok);background:color-mix(in srgb,var(--ok) 15%,transparent)}
.delta.regressed{color:var(--no);background:color-mix(in srgb,var(--no) 15%,transparent)}
.delta.new{color:var(--acc);background:color-mix(in srgb,var(--acc) 15%,transparent)}
.name{font-weight:500}
.pills{display:flex;gap:5px;flex-wrap:wrap;margin-left:auto}
.pill{font-family:var(--mono);font-size:11px;padding:2px 7px;border-radius:20px;border:1px solid var(--bd2);color:var(--mut)}
.pill.ok{color:var(--ok);border-color:color-mix(in srgb,var(--ok) 45%,transparent)}
.pill.partial{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 45%,transparent)}
.pill.no{color:var(--no);border-color:color-mix(in srgb,var(--no) 45%,transparent)}
.dur{font-family:var(--mono);font-size:11px;color:var(--faint);white-space:nowrap}
.detail{padding:4px 14px 16px;border-top:1px solid var(--bd)}
.scores{display:flex;flex-direction:column;gap:4px;margin:12px 0}
.score{display:grid;grid-template-columns:200px 48px 1fr;gap:8px;align-items:baseline;font-size:13px}
.score .sname{font-family:var(--mono);color:var(--mut)}
.score .sval{font-family:var(--mono);font-weight:600}
.score.ok .sval{color:var(--ok)} .score.partial .sval{color:var(--warn)} .score.no .sval{color:var(--no)}
.score .srat{color:var(--faint)}
.sec{margin-top:12px}
.sec h4{margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint)}
pre{margin:0;font-family:var(--mono);font-size:12px;white-space:pre-wrap;word-break:break-word;background:var(--panel2);border:1px solid var(--bd);border-radius:8px;padding:10px 12px}
pre.tool{border-left:2px solid var(--acc)}
.usage{margin-top:12px;font-family:var(--mono);font-size:12px;color:var(--faint)}
.usage b{color:var(--mut)}
.empty{color:var(--faint);text-align:center;padding:40px;font-family:var(--mono)}
`;

const SCRIPT = `
(function(){
  var q=document.getElementById('q'),grp=document.getElementById('group'),dl=document.getElementById('delta'),count=document.getElementById('count');
  var rows=[].slice.call(document.querySelectorAll('.row')),status='all';
  function apply(){
    var query=q.value.trim().toLowerCase(),g=grp?grp.value:'all',d=dl?dl.value:'all',shown=0;
    rows.forEach(function(r){
      var ok=(status==='all'||r.dataset.status===status)&&(g==='all'||r.dataset.group===g)&&(d==='all'||r.dataset.delta===d)&&(!query||r.dataset.search.indexOf(query)>=0);
      r.style.display=ok?'':'none'; if(ok)shown++;
    });
    count.textContent=shown+' / '+rows.length+' shown';
  }
  q.addEventListener('input',apply);
  if(grp)grp.addEventListener('change',apply);
  if(dl)dl.addEventListener('change',apply);
  [].forEach.call(document.querySelectorAll('[data-filter]'),function(b){
    b.addEventListener('click',function(){
      status=b.dataset.filter;
      [].forEach.call(document.querySelectorAll('[data-filter]'),function(x){x.classList.toggle('active',x===b)});
      apply();
    });
  });
  apply();
})();
`;

/**
 * Render eval results into a complete, self-contained HTML report (returns the document as a string).
 *
 * @param entries - the rows to show; map each `runEval`/`runEvalCached` result into an {@link EvalReportEntry}.
 * @param opts - {@link HtmlReportOptions} (title, timestamp).
 * @returns a full `<!doctype html>` document — no external CSS/JS/network — with summary stats and a
 *   filter-by-pass/fail, filter-by-group, free-text-search list of cases (scores, output, tool calls, cost).
 *
 * @example
 * ```ts
 * import { runEval, htmlReport, type EvalReportEntry } from "@mithril/evals";
 *
 * const entries: EvalReportEntry[] = [];
 * for await (const run of runEval(agent, cases, { deps })) entries.push({ run, group: "gpt-4o-mini" });
 * await Bun.write("report.html", htmlReport(entries, { title: "Nightly evals" }));
 * ```
 */
export function htmlReport(entries: readonly EvalReportEntry[], opts?: HtmlReportOptions): string {
  const baseline = opts?.baseline;
  const rows = withDelta(entries.map(toRow), baseline);
  const ordered = baseline !== undefined ? [...rows].sort((a, b) => DELTA_ORDER[a.delta ?? "same"] - DELTA_ORDER[b.delta ?? "same"]) : rows;
  const body = ordered.length > 0 ? ordered.map(renderRow).join("\n") : `<div class="empty">No eval cases.</div>`;
  return assembleReport(ordered, body, { title: opts?.title ?? "Mithril eval report", generatedAt: opts?.generatedAt ?? new Date().toISOString() });
}

// Sort key for diff mode: regressions first (what a reader needs to see), then improvements, new, unchanged.
const DELTA_ORDER: Readonly<Record<DeltaKind, number>> = { regressed: 0, improved: 1, new: 2, same: 3 };

/** Tag each row with its baseline comparison; a no-op (rows unchanged) when no baseline was supplied. */
function withDelta(rows: readonly RowData[], baseline: RunSnapshot | undefined): RowData[] {
  if (baseline === undefined) return [...rows];
  const base = new Map(baseline.runs.map((s) => [summaryKey(s), s.passed]));
  return rows.map((r) => {
    const was = base.get(summaryKey({ case: r.name, group: r.group }));
    const delta: DeltaKind = was === undefined ? "new" : !was && r.passed ? "improved" : was && !r.passed ? "regressed" : "same";
    return { ...r, delta };
  });
}

// The shared document shell: header stats, filter/search controls, the rows `body`, and optional extra head
// styles / body scripts — the inspector report injects the devtools CSS + client bundle through those two.
function assembleReport(rows: readonly RowData[], body: string, opts: { readonly title: string; readonly generatedAt: string; readonly headExtra?: string; readonly bodyScriptExtra?: string }): string {
  const total = rows.length;
  const passed = rows.filter((r) => r.passed).length;
  const failed = total - passed;
  const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const groups = [...new Set(rows.map((r) => r.group).filter((g) => g !== ""))].sort();
  const totalMs = rows.reduce((n, r) => n + (r.durationMs ?? 0), 0);
  const totalCost = rows.reduce((n, r) => n + r.costMicroUsd, 0);

  const groupSelect = groups.length
    ? `<select id="group" aria-label="Filter by group"><option value="all">All models</option>${groups.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join("")}</select>`
    : "";
  const durStat = totalMs > 0 ? `<div class="stat"><b>${(totalMs / 1000).toFixed(1)}s</b> total</div>` : "";
  const costStat = totalCost > 0 ? `<div class="stat"><b>${dollars(totalCost)}</b> cost</div>` : "";
  const withDeltas = rows.some((r) => r.delta !== undefined);
  const deltaStat = withDeltas
    ? `<div class="stat fail"><b>${rows.filter((r) => r.delta === "regressed").length}</b> regressed</div><div class="stat pass"><b>${rows.filter((r) => r.delta === "improved").length}</b> improved</div>`
    : "";
  const deltaSelect = withDeltas
    ? `<select id="delta" aria-label="Filter by change"><option value="all">All changes</option><option value="regressed">Regressed</option><option value="improved">Improved</option><option value="new">New</option><option value="same">Unchanged</option></select>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<style>${STYLE}</style>${opts.headExtra ?? ""}
</head>
<body>
<div class="wrap">
<header>
  <h1>${esc(opts.title)}</h1>
  <div class="meta">generated ${esc(opts.generatedAt)}</div>
  <div class="stats">
    <div class="stat"><b>${total}</b> cases</div>
    <div class="stat pass"><b>${passed}</b> passed</div>
    <div class="stat fail"><b>${failed}</b> failed</div>
    <div class="stat"><b>${rate}%</b> pass rate</div>
    ${groups.length ? `<div class="stat"><b>${groups.length}</b> models</div>` : ""}
    ${durStat}${costStat}${deltaStat}
  </div>
  <div class="controls">
    <input id="q" type="search" placeholder="Search cases, output, tools, scorers…" aria-label="Search">
    <div class="filters">
      <button data-filter="all" class="active">All</button>
      <button data-filter="pass">Passed</button>
      <button data-filter="fail">Failed</button>
    </div>
    ${groupSelect}
    ${deltaSelect}
    <span id="count"></span>
  </div>
</header>
<main>
${body}
</main>
</div>
<script>${SCRIPT}</script>${opts.bodyScriptExtra ?? ""}
</body>
</html>`;
}

// Bundle the browser inspector client (inspector-client.ts) to a self-contained IIFE and read the devtools
// stylesheet, so the report can inline both — memoised, since neither changes at runtime.
let inspectorAssets: Promise<{ readonly js: string; readonly css: string }> | undefined;
function buildInspectorAssets(): Promise<{ readonly js: string; readonly css: string }> {
  inspectorAssets ??= (async () => {
    // Imported lazily (not at module top level) so `@mithril/evals` stays browser-importable —
    // the playground worker imports the whole package, and a static `node:url` import would be
    // externalized by the bundler and throw on access. This Bun-only path never runs in browsers.
    const { fileURLToPath, pathToFileURL } = await import("node:url");
    const from = fileURLToPath(import.meta.url);
    const entry = fileURLToPath(new URL("./inspector-client.ts", import.meta.url));
    const built = await Bun.build({ entrypoints: [entry], target: "browser", format: "iife", minify: true });
    if (!built.success) throw new Error(`inspectorReport: could not bundle the devtools client:\n${built.logs.map((l) => String(l)).join("\n")}`);
    const out = built.outputs[0];
    if (out === undefined) throw new Error("inspectorReport: the devtools client bundle produced no output.");
    const js = await out.text();
    // `@mithril/devtools/ui.css` isn't resolvable as a module, but it sits beside the resolvable `dom` entry.
    const domPath = Bun.resolveSync("@mithril/devtools/dom", from);
    const cssPath = fileURLToPath(new URL("./ui/ui.css", pathToFileURL(domPath)));
    const css = await Bun.file(cssPath).text();
    return { js, css };
  })();
  return inspectorAssets;
}

/**
 * Like {@link htmlReport}, but every case row hosts a live **`@mithril/devtools` run inspector** — the event
 * stream, message/tool transcript, span tree, and cost/context meters, with a time-travel scrubber — mounted
 * from the case's recorded trajectory. Still one self-contained file (the devtools UI + client are inlined);
 * it just renders the whole trajectory, not only the final output.
 *
 * @param entries - the rows to show; map each `runEval`/`runEvalCached` result into an {@link EvalReportEntry}.
 * @param opts - {@link InspectorReportOptions} (title, timestamp, and the model `contextWindow` for the fill bar).
 * @returns a Promise of a full `<!doctype html>` document with an embedded devtools inspector per case.
 * @remarks Requires the **Bun** runtime — it bundles the browser client with `Bun.build`. Use
 * {@link htmlReport} for a runtime-agnostic, static report.
 * @example
 * ```ts
 * import { runEval, inspectorReport, type EvalReportEntry } from "@mithril/evals";
 *
 * const entries: EvalReportEntry[] = [];
 * for await (const run of runEval(agent, cases, { deps })) entries.push({ run, group: "gpt-4o-mini" });
 * await Bun.write("report.html", await inspectorReport(entries, { title: "Nightly evals", contextWindow: 200_000 }));
 * ```
 */
export async function inspectorReport(entries: readonly EvalReportEntry[], opts?: InspectorReportOptions): Promise<string> {
  if (typeof Bun === "undefined") throw new Error("inspectorReport requires the Bun runtime (it bundles the devtools client via Bun.build). Use htmlReport for a runtime-agnostic report.");
  const { js, css } = await buildInspectorAssets();
  const pairs = entries.map((e) => ({ row: toRow(e), log: e.run.trajectory.log }));
  const body = pairs.length > 0 ? pairs.map(({ row, log }) => renderInspectorRow(row, log, opts?.contextWindow)).join("\n") : `<div class="empty">No eval cases.</div>`;
  return assembleReport(
    pairs.map((p) => p.row),
    body,
    {
      title: opts?.title ?? "Mithril eval report",
      generatedAt: opts?.generatedAt ?? new Date().toISOString(),
      headExtra: `\n<style>${css}</style>`,
      // Neutralise any literal </script> in the bundle so it can't close the inline tag early.
      bodyScriptExtra: `\n<script>${js.replace(/<\/script>/gi, "<\\/script>")}</script>`,
    },
  );
}
