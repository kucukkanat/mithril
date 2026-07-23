/**
 * Post-processes a promptfoo `report.json` into a compact model-comparison overview and injects it
 * **above** promptfoo's own results table in `report.html`. The detailed table + detail drawer that
 * promptfoo renders are kept as-is; this only prepends an at-a-glance section so a reader can compare
 * models without scanning the full matrix.
 *
 * It groups every result by **model** (`result.provider.label`) × **suite** (`result.vars.category`,
 * stamped in {@link file://../promptfooconfig.ts}) and computes:
 *   - per-suite pass rate = passed / total for that model in that suite, and
 *   - an **overall** score = the equal-weighted mean of a model's per-suite rates (each suite counts
 *     once regardless of how many tests it has).
 *
 * It then renders, with **zero dependencies** (inline SVG/CSS, reusing the report's own CSS tokens):
 *   - a **leaderboard** of ranked model cards (overall bar + rank + "best for <suite>" badges),
 *   - a **models × suites heatmap** (red→green tint per cell, best model per suite highlighted), and
 *   - a redesigned **"Detailed results" table** (one row per model × test) that *replaces* promptfoo's
 *     wide result matrix: sticky sortable headers, global search + model/suite/status filters, a
 *     density toggle, zebra striping, right-aligned numeric columns, 2-line-clamped long-text cells,
 *     and click-to-expand inline rows revealing the full input, output, and grade.
 *
 * Wired into the `eval:html` / `report` scripts, so it runs automatically after promptfoo writes both
 * outputs. Run standalone with:  bun run src/report.ts [_report/report.json] [_report/report.html]
 */
import { readFileSync, writeFileSync } from "node:fs";

/** The slice of a promptfoo `report.json` result row this overview reads. */
interface ResultRow {
  readonly success?: boolean;
  readonly score?: number;
  readonly latencyMs?: number;
  readonly provider?: { readonly label?: string; readonly id?: string };
  readonly vars?: Record<string, unknown>;
  readonly prompt?: { readonly raw?: string; readonly label?: string };
  readonly response?: { readonly output?: unknown; readonly tokenUsage?: { readonly total?: number } };
  readonly tokenUsage?: { readonly total?: number };
  readonly gradingResult?: { readonly reason?: string; readonly pass?: boolean };
  readonly testCase?: { readonly description?: string };
  readonly error?: string;
}

/** One flattened (model × test) result, the unit of the redesigned detailed results table. */
interface DetailRow {
  readonly model: string;
  readonly suite: string;
  readonly test: string;
  readonly input: string;
  readonly output: string;
  readonly reason: string;
  readonly status: "pass" | "fail" | "error";
  readonly score: number | null;
  readonly latencyMs: number | null;
  readonly tokens: number | null;
}

/** Pass tally for one (model, suite) pair. */
interface Cell {
  passed: number;
  total: number;
}

/** A model's aggregated scores across suites, plus its equal-weighted overall. */
interface ModelScore {
  readonly label: string;
  /** category → pass rate in [0,1]; only suites the model actually ran appear. */
  readonly rates: Map<string, number>;
  /** category → raw tally, for tooltips. */
  readonly tallies: Map<string, Cell>;
  /** Equal-weighted mean of `rates`, or `null` when the model ran no graded tests. */
  readonly overall: number | null;
}

const UNCATEGORIZED = "Uncategorized";

/** Read the JSON report, tolerating both `{ results: { results } }` and a bare `{ results }` shape. */
function loadResults(path: string): ResultRow[] {
  const parsed = JSON.parse(readFileSync(path, "utf8")) as { results?: { results?: ResultRow[] } | ResultRow[] };
  const results = parsed.results;
  if (Array.isArray(results)) return results;
  if (results && Array.isArray(results.results)) return results.results;
  throw new Error(`No results[] found in ${path} — was this produced by 'promptfoo eval --output <file>.json'?`);
}

/** The model label for a row (provider label → provider id → a stable fallback). */
function modelOf(row: ResultRow): string {
  return row.provider?.label?.trim() || row.provider?.id?.trim() || "unknown model";
}

/** The suite/category for a row (the `category` var stamped by the config), or a fallback bucket. */
function suiteOf(row: ResultRow): string {
  const c = row.vars?.["category"];
  return typeof c === "string" && c.trim().length > 0 ? c.trim() : UNCATEGORIZED;
}

/** Coerce an arbitrary output value (string, or a structured object) into a readable string. */
function outputOf(row: ResultRow): string {
  const out = row.response?.output;
  if (typeof out === "string") return out;
  if (out === undefined || out === null) return "";
  try {
    return JSON.stringify(out, null, 2);
  } catch {
    return String(out);
  }
}

/** Flatten each result row into the (model × test) unit the detailed table renders. */
function extractDetails(rows: ReadonlyArray<ResultRow>): DetailRow[] {
  return rows.map((row) => {
    const status: DetailRow["status"] = row.success === true ? "pass" : row.error ? "error" : "fail";
    const tokens = row.response?.tokenUsage?.total ?? row.tokenUsage?.total ?? null;
    return {
      model: modelOf(row),
      suite: suiteOf(row),
      test: row.testCase?.description?.trim() || "—",
      input: (row.prompt?.raw ?? (typeof row.vars?.["input"] === "string" ? (row.vars["input"] as string) : "")).trim(),
      output: outputOf(row).trim(),
      reason: (row.gradingResult?.reason ?? row.error ?? "").trim(),
      status,
      score: typeof row.score === "number" ? row.score : null,
      latencyMs: typeof row.latencyMs === "number" ? row.latencyMs : null,
      tokens: typeof tokens === "number" ? tokens : null,
    };
  });
}

/** Group rows into per-model, per-suite pass rates + an equal-weighted overall. Returns models and the
 * ordered suite list (first-seen order = suite/test authoring order). */
function aggregate(rows: ReadonlyArray<ResultRow>): { models: ModelScore[]; suites: string[] } {
  const suiteOrder: string[] = [];
  const seenSuite = new Set<string>();
  // model → (suite → tally)
  const byModel = new Map<string, Map<string, Cell>>();
  const modelOrder: string[] = [];

  for (const row of rows) {
    const model = modelOf(row);
    const suite = suiteOf(row);
    if (!seenSuite.has(suite)) {
      seenSuite.add(suite);
      suiteOrder.push(suite);
    }
    let suites = byModel.get(model);
    if (suites === undefined) {
      suites = new Map<string, Cell>();
      byModel.set(model, suites);
      modelOrder.push(model);
    }
    let cell = suites.get(suite);
    if (cell === undefined) {
      cell = { passed: 0, total: 0 };
      suites.set(suite, cell);
    }
    cell.total += 1;
    if (row.success === true) cell.passed += 1;
  }

  const models: ModelScore[] = modelOrder.map((label) => {
    const tallies = byModel.get(label) ?? new Map<string, Cell>();
    const rates = new Map<string, number>();
    for (const [suite, cell] of tallies) {
      if (cell.total > 0) rates.set(suite, cell.passed / cell.total);
    }
    const values = [...rates.values()];
    const overall = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
    return { label, rates, tallies, overall };
  });

  // Leaderboard order: overall desc (models with no score sink to the bottom), tie-break by label.
  models.sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1) || a.label.localeCompare(b.label));
  return { models, suites: suiteOrder };
}

/** HTML-escape a string for safe interpolation into the report. */
function esc(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => (
    ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === '"' ? "&quot;" : "&#39;"
  ));
}

/** Format a [0,1] rate as a whole-percent string; `—` when the model didn't run the suite. */
function pct(rate: number | null | undefined): string {
  return rate === null || rate === undefined ? "—" : `${Math.round(rate * 100)}%`;
}

/** A red→green tint for a rate: light background + darker text, readable on the light report. */
function heatStyle(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return "color:var(--text-muted);background:var(--surface-muted);";
  const hue = Math.round(rate * 140); // 0 = red, 140 = green
  return `background:hsl(${hue} 68% 90%);color:hsl(${hue} 72% 26%);`;
}

/** The best pass rate for a suite across all models (used to highlight the winner column-cell). */
function bestRate(models: ReadonlyArray<ModelScore>, suite: string): number | null {
  let best: number | null = null;
  for (const m of models) {
    const r = m.rates.get(suite);
    if (r !== undefined && (best === null || r > best)) best = r;
  }
  return best;
}

/** Suites a given model wins outright (strictly the top scorer, and better than everyone tied below). */
function bestFor(models: ReadonlyArray<ModelScore>, model: ModelScore, suites: ReadonlyArray<string>): string[] {
  const wins: string[] = [];
  for (const suite of suites) {
    const r = model.rates.get(suite);
    if (r === undefined) continue;
    const best = bestRate(models, suite);
    if (best !== null && r >= best - 1e-9 && r > 0) wins.push(suite);
  }
  return wins;
}

/** Render the leaderboard of ranked model cards. */
function renderLeaderboard(models: ReadonlyArray<ModelScore>, suites: ReadonlyArray<string>): string {
  const cards = models.map((m, i) => {
    const rank = i + 1;
    const overallPct = pct(m.overall);
    const barWidth = m.overall === null ? 0 : Math.round(m.overall * 100);
    const badges = bestFor(models, m, suites)
      .map((s) => `<span class="cmp-badge" title="Top scorer for ${esc(s)}">★ ${esc(s)}</span>`)
      .join("");
    const suiteCount = m.rates.size;
    const totalTests = [...m.tallies.values()].reduce((a, c) => a + c.total, 0);
    return `
        <article class="cmp-card${rank === 1 ? " cmp-card--lead" : ""}">
          <div class="cmp-card-top">
            <span class="cmp-rank" aria-label="Rank ${rank}">#${rank}</span>
            <span class="cmp-card-name" title="${esc(m.label)}">${esc(m.label)}</span>
            <span class="cmp-card-score" style="${heatStyle(m.overall)}">${overallPct}</span>
          </div>
          <div class="cmp-bar" role="img" aria-label="Overall pass rate ${overallPct}">
            <span class="cmp-bar-fill" style="width:${barWidth}%;${heatStyle(m.overall)}"></span>
          </div>
          <div class="cmp-card-meta">Overall across ${suiteCount} suite${suiteCount === 1 ? "" : "s"} · ${totalTests} test${totalTests === 1 ? "" : "s"}</div>
          ${badges ? `<div class="cmp-badges">${badges}</div>` : ""}
        </article>`;
  }).join("");
  return `<div class="cmp-leaderboard">${cards}</div>`;
}

/** Render the models × suites heatmap (rows = models, columns = suites + Overall). */
function renderHeatmap(models: ReadonlyArray<ModelScore>, suites: ReadonlyArray<string>): string {
  const head = suites.map((s) => `<th scope="col" title="${esc(s)}">${esc(s)}</th>`).join("");
  const rows = models.map((m) => {
    const cells = suites.map((s) => {
      const r = m.rates.get(s);
      const cell = m.tallies.get(s);
      const isBest = r !== undefined && r > 0 && r >= (bestRate(models, s) ?? Infinity) - 1e-9;
      const tip = cell ? `${esc(m.label)} — ${esc(s)}: ${cell.passed}/${cell.total} passed` : `${esc(m.label)} — ${esc(s)}: no results`;
      return `<td class="cmp-cell${isBest ? " cmp-cell--best" : ""}" style="${heatStyle(r)}" title="${tip}">${isBest ? "★ " : ""}${pct(r)}</td>`;
    }).join("");
    return `
            <tr>
              <th scope="row" class="cmp-row-head" title="${esc(m.label)}">${esc(m.label)}</th>
              ${cells}
              <td class="cmp-cell cmp-cell--overall" style="${heatStyle(m.overall)}">${pct(m.overall)}</td>
            </tr>`;
  }).join("");
  return `
        <div class="cmp-heatmap-shell">
          <table class="cmp-heatmap">
            <caption class="cmp-sr">Pass rate per model per suite. Higher is greener; ★ marks the best model in a suite.</caption>
            <thead>
              <tr>
                <th scope="col" class="cmp-row-head">Model</th>
                ${head}
                <th scope="col" title="Equal-weighted mean of the per-suite rates">Overall</th>
              </tr>
            </thead>
            <tbody>${rows}
            </tbody>
          </table>
        </div>`;
}

/** The scoped stylesheet for the overview (reuses the report's CSS tokens; adds nothing global). */
const OVERVIEW_STYLE = `
      <style>
        .comparison-overview { padding: 24px 28px 28px; margin-bottom: 20px; }
        .cmp-head { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
        .cmp-head h2 { margin: 0; font-size: 20px; }
        .cmp-sub { margin: 0 0 18px; color: var(--text-muted); font-size: 13px; }
        .cmp-section-label { font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--text-muted); margin: 18px 0 10px; }
        .cmp-leaderboard { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
        .cmp-card { border: 1px solid var(--border); border-radius: 8px; padding: 14px 14px 12px; background: var(--surface-muted); display: grid; gap: 8px; }
        .cmp-card--lead { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
        .cmp-card-top { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; }
        .cmp-rank { font-weight: 800; font-size: 13px; color: var(--text-muted); }
        .cmp-card--lead .cmp-rank { color: var(--accent); }
        .cmp-card-name { font-weight: 700; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cmp-card-score { font-weight: 800; font-size: 14px; border-radius: 999px; padding: 2px 10px; }
        .cmp-bar { height: 8px; border-radius: 999px; background: var(--border); overflow: hidden; }
        .cmp-bar-fill { display: block; height: 100%; border-radius: 999px; }
        .cmp-card-meta { font-size: 12px; color: var(--text-muted); }
        .cmp-badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .cmp-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: var(--pass-bg); color: var(--pass); border: 1px solid color-mix(in srgb, var(--pass) 25%, transparent); }
        .cmp-heatmap-shell { overflow-x: auto; }
        .cmp-heatmap { border-collapse: separate; border-spacing: 3px; width: 100%; }
        .cmp-heatmap th, .cmp-heatmap td { text-align: center; font-size: 12px; padding: 8px 10px; border-radius: 6px; }
        .cmp-heatmap thead th { color: var(--text-muted); font-weight: 700; background: transparent; }
        .cmp-row-head { text-align: left !important; font-weight: 700; color: var(--text); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cmp-cell { font-weight: 700; font-variant-numeric: tabular-nums; }
        .cmp-cell--best { outline: 2px solid var(--accent); outline-offset: -2px; }
        .cmp-cell--overall { font-weight: 800; }
        .cmp-legend { display: flex; align-items: center; gap: 10px; margin-top: 12px; font-size: 12px; color: var(--text-muted); }
        .cmp-legend-scale { height: 10px; width: 160px; border-radius: 999px; background: linear-gradient(90deg, hsl(0 68% 90%), hsl(70 68% 90%), hsl(140 68% 90%)); border: 1px solid var(--border); }
        .cmp-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
      </style>`;

/** Build the full overview `<section>` (style + leaderboard + heatmap + legend) to inject into the report. */
function renderOverview(models: ReadonlyArray<ModelScore>, suites: ReadonlyArray<string>): string {
  const modelCount = models.length;
  const suiteCount = suites.length;
  const subtitle = `Ranked by overall pass rate — the equal-weighted mean of each model's per-suite rates `
    + `(every suite counts once, regardless of test count). ${modelCount} model${modelCount === 1 ? "" : "s"} · `
    + `${suiteCount} suite${suiteCount === 1 ? "" : "s"}.`;
  return `${OVERVIEW_STYLE}
      <section class="report-panel comparison-overview" aria-labelledby="comparison-heading">
        <div class="cmp-head">
          <h2 id="comparison-heading">Model comparison</h2>
        </div>
        <p class="cmp-sub">${esc(subtitle)}</p>
        <p class="cmp-section-label">Leaderboard</p>
        ${renderLeaderboard(models, suites)}
        <p class="cmp-section-label">Pass rate by suite</p>
        ${renderHeatmap(models, suites)}
        <div class="cmp-legend" aria-hidden="true">
          <span>0%</span><span class="cmp-legend-scale"></span><span>100%</span>
          <span>· ★ best model in a suite</span>
        </div>
      </section>`;
}

/** Format an integer with thin thousands separators; `—` when missing. */
function fmtInt(n: number | null): string {
  return n === null ? "—" : n.toLocaleString("en-US");
}

/** Format a [0,1]-ish score to two decimals; `—` when missing. */
function fmtScore(n: number | null): string {
  return n === null ? "—" : n.toFixed(2);
}

/** A short, human status label for the pill. */
function statusLabel(s: DetailRow["status"]): string {
  return s === "pass" ? "Pass" : s === "error" ? "Error" : "Fail";
}

/**
 * The scoped stylesheet for the redesigned detailed-results table. Applies the researched table-UX
 * patterns: sticky bold headers, zebra striping, left-aligned text / right-aligned numbers, 2-line
 * clamped long-text cells with click-to-expand, status pills, and a compact density toggle. Reuses
 * the report's own CSS tokens so it tracks the light/dark theme.
 */
const RESULTS_STYLE = `
      <style>
        .results-detail { padding: 22px 24px 24px; margin-bottom: 20px; }
        .rr-head { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .rr-head h2 { margin: 0; font-size: 20px; }
        .rr-sub { margin: 4px 0 16px; color: var(--text-muted); font-size: 13px; }
        .rr-toolbar { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; margin-bottom: 14px; }
        .rr-control { display: flex; flex-direction: column; gap: 4px; }
        .rr-control label { font-size: 11px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; color: var(--text-muted); }
        .rr-control input, .rr-control select { font: inherit; font-size: 13px; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: 7px; padding: 7px 10px; min-height: 34px; }
        .rr-control input:focus, .rr-control select:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
        .rr-search { min-width: 240px; }
        .rr-toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
        .rr-count { font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
        .rr-btn { font: inherit; font-size: 12px; font-weight: 700; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: 7px; padding: 7px 12px; min-height: 34px; cursor: pointer; }
        .rr-btn:hover { border-color: var(--accent); }
        .rr-btn[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
        .rr-shell { overflow-x: auto; border: 1px solid var(--border); border-radius: 10px; }
        .rr-table { border-collapse: collapse; width: 100%; font-size: 13px; }
        .rr-table thead th { position: sticky; top: 0; z-index: 2; background: var(--surface-muted); color: var(--text); font-weight: 700; text-align: left; white-space: nowrap; padding: 10px 12px; border-bottom: 1px solid var(--border); }
        .rr-table th.rr-sortable { cursor: pointer; user-select: none; }
        .rr-table th.rr-sortable:hover { color: var(--accent); }
        .rr-th-inner { display: inline-flex; align-items: center; gap: 5px; }
        .rr-th-num .rr-th-inner { justify-content: flex-end; }
        .rr-arrow { font-size: 10px; color: var(--text-muted); opacity: 0; }
        .rr-table th[aria-sort="ascending"] .rr-arrow, .rr-table th[aria-sort="descending"] .rr-arrow { opacity: 1; color: var(--accent); }
        .rr-table th[aria-sort="ascending"] .rr-arrow::after { content: "▲"; }
        .rr-table th[aria-sort="descending"] .rr-arrow::after { content: "▼"; }
        .rr-table th[aria-sort="none"] .rr-arrow::after { content: "↕"; }
        .rr-table th.rr-sortable .rr-arrow { opacity: .45; }
        .rr-table tbody td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
        .rr-table tbody tr.rr-row:nth-of-type(4n+3) { background: color-mix(in srgb, var(--surface-muted) 45%, transparent); }
        .rr-table tbody tr.rr-row { cursor: pointer; }
        .rr-table tbody tr.rr-row:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
        .rr-table tbody tr.rr-row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
        .rr-table.rr-dense tbody td { padding: 5px 12px; }
        .rr-table.rr-dense .rr-clamp { -webkit-line-clamp: 1; }
        .rr-c-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .rr-c-model { font-weight: 700; white-space: nowrap; }
        .rr-c-expand { width: 26px; text-align: center; color: var(--text-muted); }
        .rr-caret { display: inline-block; transition: transform .12s ease; font-size: 10px; }
        .rr-row[aria-expanded="true"] .rr-caret { transform: rotate(90deg); color: var(--accent); }
        .rr-clamp { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; max-width: 46ch; line-height: 1.4; }
        .rr-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: var(--surface-muted); border: 1px solid var(--border); color: var(--text-muted); white-space: nowrap; }
        .rr-pill { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: .02em; padding: 2px 9px; border-radius: 999px; }
        .rr-pill--pass { background: var(--pass-bg); color: var(--pass); }
        .rr-pill--fail { background: var(--fail-bg); color: var(--fail); }
        .rr-pill--error { background: var(--error-bg); color: var(--error); }
        .rr-detail > td { background: color-mix(in srgb, var(--surface-muted) 60%, transparent); padding: 0 12px 14px; }
        .rr-detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; padding-top: 12px; }
        .rr-detail-sec h4 { margin: 0 0 5px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--text-muted); }
        .rr-detail-sec pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 12.5px; line-height: 1.5; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; max-height: 340px; overflow: auto; }
        .rr-detail-reason { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--text); }
        .rr-empty { display: none; padding: 28px; text-align: center; color: var(--text-muted); font-size: 13px; }
        .rr-empty.rr-visible { display: block; }
        .rr-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
        @media (max-width: 720px) { .rr-clamp { max-width: 30ch; } .rr-search { min-width: 160px; } }
      </style>`;

/** Render one option list (an "all" option + one per distinct, order-preserved value). */
function optionsFor(allLabel: string, values: ReadonlyArray<string>): string {
  const seen = new Set<string>();
  const opts = [`<option value="">${esc(allLabel)}</option>`];
  for (const v of values) {
    if (seen.has(v)) continue;
    seen.add(v);
    opts.push(`<option value="${esc(v)}">${esc(v)}</option>`);
  }
  return opts.join("");
}

/** Render a sortable column header cell. */
function th(key: string, label: string, numeric = false): string {
  return `<th class="rr-sortable${numeric ? " rr-th-num" : ""}" data-sort-key="${key}" data-sort-type="${numeric ? "num" : "text"}" aria-sort="none" scope="col">`
    + `<span class="rr-th-inner">${esc(label)}<span class="rr-arrow" aria-hidden="true"></span></span></th>`;
}

/** Render a single data row plus its (hidden) inline expansion row. */
function renderRow(d: DetailRow, idx: number): string {
  const search = `${d.model} ${d.suite} ${d.test} ${d.input} ${d.output} ${d.reason}`.toLowerCase();
  const statusRank = d.status === "pass" ? "2" : d.status === "fail" ? "1" : "0";
  const numAttr = (n: number | null) => (n === null ? "" : String(n));
  const reason = d.reason
    ? `<div class="rr-detail-sec"><h4>Why this ${esc(statusLabel(d.status).toLowerCase())}</h4><p class="rr-detail-reason">${esc(d.reason)}</p></div>`
    : "";
  return `
              <tr class="rr-row" data-rr-row tabindex="0" role="button" aria-expanded="false" aria-controls="rr-detail-${idx}"
                data-status="${d.status}" data-model="${esc(d.model)}" data-suite="${esc(d.suite)}" data-search="${esc(search)}"
                data-k-status="${statusRank}" data-k-model="${esc(d.model)}" data-k-suite="${esc(d.suite)}" data-k-test="${esc(d.test)}"
                data-k-input="${esc(d.input)}" data-k-output="${esc(d.output)}"
                data-k-score="${numAttr(d.score)}" data-k-latency="${numAttr(d.latencyMs)}" data-k-tokens="${numAttr(d.tokens)}">
                <td class="rr-c-expand"><span class="rr-caret" aria-hidden="true">▶</span></td>
                <td><span class="rr-pill rr-pill--${d.status}">${esc(statusLabel(d.status))}</span></td>
                <td class="rr-c-model" title="${esc(d.model)}">${esc(d.model)}</td>
                <td><span class="rr-badge">${esc(d.suite)}</span></td>
                <td><div class="rr-clamp" title="${esc(d.test)}">${esc(d.test)}</div></td>
                <td><div class="rr-clamp" title="${esc(d.input)}">${esc(d.input) || "<span class=\"rr-badge\">—</span>"}</div></td>
                <td><div class="rr-clamp" title="${esc(d.output)}">${esc(d.output) || "<span class=\"rr-badge\">—</span>"}</div></td>
                <td class="rr-c-num">${fmtScore(d.score)}</td>
                <td class="rr-c-num">${fmtInt(d.latencyMs)}</td>
                <td class="rr-c-num">${fmtInt(d.tokens)}</td>
              </tr>
              <tr class="rr-detail" id="rr-detail-${idx}" data-rr-detail hidden>
                <td colspan="10">
                  <div class="rr-detail-grid">
                    <div class="rr-detail-sec"><h4>Input</h4><pre>${esc(d.input) || "—"}</pre></div>
                    <div class="rr-detail-sec"><h4>Output</h4><pre>${esc(d.output) || "—"}</pre></div>
                    ${reason}
                  </div>
                </td>
              </tr>`;
}

/** Client-side behavior for the detailed table: debounced search, model/suite/status filters, column
 * sorting, inline row expansion, density toggle, and a reset — all dependency-free and null-guarded. */
const RESULTS_SCRIPT = `
      <script>
        (function () {
          var root = document.querySelector('[data-results-detail]');
          if (!root) return;
          var table = root.querySelector('[data-rr-table]');
          var tbody = table.querySelector('tbody');
          var search = root.querySelector('[data-rr-search]');
          var modelSel = root.querySelector('[data-rr-model]');
          var suiteSel = root.querySelector('[data-rr-suite]');
          var statusSel = root.querySelector('[data-rr-status]');
          var densityBtn = root.querySelector('[data-rr-density]');
          var resetBtn = root.querySelector('[data-rr-reset]');
          var countEl = root.querySelector('[data-rr-count]');
          var totalEl = root.querySelector('[data-rr-total]');
          var emptyEl = root.querySelector('[data-rr-empty]');
          var rows = Array.prototype.slice.call(tbody.querySelectorAll('.rr-row'));
          var total = rows.length;
          if (totalEl) totalEl.textContent = String(total);

          function detailOf(row) { return row.nextElementSibling; }

          function apply() {
            var q = (search && search.value || '').trim().toLowerCase();
            var m = modelSel && modelSel.value || '';
            var s = suiteSel && suiteSel.value || '';
            var st = statusSel && statusSel.value || '';
            var shown = 0;
            rows.forEach(function (row) {
              var ok = (!q || (row.getAttribute('data-search') || '').indexOf(q) !== -1)
                && (!m || row.getAttribute('data-model') === m)
                && (!s || row.getAttribute('data-suite') === s)
                && (!st || row.getAttribute('data-status') === st);
              row.hidden = !ok;
              var det = detailOf(row);
              if (det && !ok) { det.hidden = true; row.setAttribute('aria-expanded', 'false'); }
              if (ok) shown++;
            });
            if (countEl) countEl.textContent = String(shown);
            if (emptyEl) emptyEl.classList.toggle('rr-visible', shown === 0);
          }

          var t;
          function debouncedApply() { clearTimeout(t); t = setTimeout(apply, 120); }
          if (search) search.addEventListener('input', debouncedApply);
          [modelSel, suiteSel, statusSel].forEach(function (el) { if (el) el.addEventListener('change', apply); });

          if (resetBtn) resetBtn.addEventListener('click', function () {
            if (search) search.value = '';
            if (modelSel) modelSel.value = '';
            if (suiteSel) suiteSel.value = '';
            if (statusSel) statusSel.value = '';
            apply();
          });

          if (densityBtn) densityBtn.addEventListener('click', function () {
            var dense = table.classList.toggle('rr-dense');
            densityBtn.setAttribute('aria-pressed', dense ? 'true' : 'false');
            densityBtn.textContent = dense ? 'Comfortable' : 'Compact';
          });

          function toggleRow(row) {
            var det = detailOf(row);
            if (!det) return;
            var open = det.hidden;
            det.hidden = !open;
            row.setAttribute('aria-expanded', open ? 'true' : 'false');
          }
          rows.forEach(function (row) {
            row.addEventListener('click', function (e) {
              if (window.getSelection && String(window.getSelection())) return;
              toggleRow(row);
            });
            row.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(row); }
            });
          });

          var headers = Array.prototype.slice.call(table.querySelectorAll('th.rr-sortable'));
          function sortBy(th) {
            var key = th.getAttribute('data-sort-key');
            var numeric = th.getAttribute('data-sort-type') === 'num';
            var cur = th.getAttribute('aria-sort');
            var dir = cur === 'ascending' ? -1 : 1;
            headers.forEach(function (h) { h.setAttribute('aria-sort', 'none'); });
            th.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
            var attr = 'data-k-' + key;
            var sorted = rows.slice().sort(function (a, b) {
              var av = a.getAttribute(attr) || '';
              var bv = b.getAttribute(attr) || '';
              if (numeric) {
                var an = av === '' ? NaN : parseFloat(av);
                var bn = bv === '' ? NaN : parseFloat(bv);
                if (isNaN(an) && isNaN(bn)) return 0;
                if (isNaN(an)) return 1;
                if (isNaN(bn)) return -1;
                return (an - bn) * dir;
              }
              return av.localeCompare(bv) * dir;
            });
            sorted.forEach(function (row) { var det = detailOf(row); tbody.appendChild(row); if (det) tbody.appendChild(det); });
          }
          headers.forEach(function (th) {
            th.addEventListener('click', function () { sortBy(th); });
          });

          apply();
        })();
      </script>`;

/** Build the redesigned "Detailed results" `<section>` (style + toolbar + sortable table + inline detail
 * rows + behavior script) that replaces promptfoo's wide result matrix. */
function renderResultsPanel(details: ReadonlyArray<DetailRow>): string {
  const body = details.map((d, i) => renderRow(d, i)).join("");
  const subtitle = `Every model × test result — search, filter, sort any column, and click a row to expand the full input, output, and grade. ${details.length} result${details.length === 1 ? "" : "s"}.`;
  return `${RESULTS_STYLE}
      <section class="report-panel results-detail" data-results-detail aria-labelledby="results-detail-heading">
        <div class="rr-head">
          <h2 id="results-detail-heading">Detailed results</h2>
        </div>
        <p class="rr-sub">${esc(subtitle)}</p>
        <div class="rr-toolbar">
          <div class="rr-control rr-search">
            <label for="rr-search">Search</label>
            <input id="rr-search" data-rr-search type="search" autocomplete="off" placeholder="Search input, output, model, grade…" />
          </div>
          <div class="rr-control">
            <label for="rr-model">Model</label>
            <select id="rr-model" data-rr-model>${optionsFor("All models", details.map((d) => d.model))}</select>
          </div>
          <div class="rr-control">
            <label for="rr-suite">Suite</label>
            <select id="rr-suite" data-rr-suite>${optionsFor("All suites", details.map((d) => d.suite))}</select>
          </div>
          <div class="rr-control">
            <label for="rr-status">Status</label>
            <select id="rr-status" data-rr-status>
              <option value="">All statuses</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div class="rr-toolbar-right">
            <span class="rr-count"><span data-rr-count>${details.length}</span> of <span data-rr-total>${details.length}</span></span>
            <button type="button" class="rr-btn" data-rr-density aria-pressed="false">Compact</button>
            <button type="button" class="rr-btn" data-rr-reset>Reset</button>
          </div>
        </div>
        <div class="rr-shell">
          <table class="rr-table" data-rr-table>
            <caption class="rr-sr">Detailed evaluation results: one row per model and test. Sortable and filterable.</caption>
            <thead>
              <tr>
                <th class="rr-c-expand" scope="col"><span class="rr-sr">Expand</span></th>
                ${th("status", "Status")}
                ${th("model", "Model")}
                ${th("suite", "Suite")}
                ${th("test", "Test")}
                ${th("input", "Input")}
                ${th("output", "Output")}
                ${th("score", "Score", true)}
                ${th("latency", "Latency (ms)", true)}
                ${th("tokens", "Tokens", true)}
              </tr>
            </thead>
            <tbody>${body}
            </tbody>
          </table>
          <div class="rr-empty" data-rr-empty>No results match your filters.</div>
        </div>
      </section>${RESULTS_SCRIPT}`;
}

/** Replace promptfoo's wide results matrix with our overview + redesigned detailed table; fall back to
 * injecting before `</main>` if the results panel can't be located. */
function inject(html: string, overview: string, resultsPanel: string): string {
  const anchor = '<section class="report-panel" aria-labelledby="results-heading">';
  const start = html.indexOf(anchor);
  if (start !== -1) {
    const end = html.indexOf("</section>", start);
    if (end !== -1) {
      const after = end + "</section>".length;
      return `${html.slice(0, start)}${overview}\n      ${resultsPanel}${html.slice(after)}`;
    }
  }
  if (html.includes("</main>")) return html.replace("</main>", `${overview}\n      ${resultsPanel}\n    </main>`);
  throw new Error("Could not find an injection point (results panel or </main>) in the HTML report.");
}

function main(): void {
  const jsonPath = process.argv[2] ?? "_report/report.json";
  const htmlPath = process.argv[3] ?? "_report/report.html";

  const rows = loadResults(jsonPath);
  const { models, suites } = aggregate(rows);
  if (models.length === 0) {
    console.warn(`[report] no results in ${jsonPath}; leaving ${htmlPath} untouched.`);
    return;
  }
  const details = extractDetails(rows);

  const html = readFileSync(htmlPath, "utf8");
  if (html.includes('class="report-panel comparison-overview"')) {
    console.warn(`[report] ${htmlPath} already has a comparison overview; regenerate the report to refresh it.`);
    return;
  }
  writeFileSync(htmlPath, inject(html, renderOverview(models, suites), renderResultsPanel(details)));
  console.log(`[report] injected model comparison overview + redesigned detailed table into ${htmlPath} (${models.length} models × ${suites.length} suites, ${details.length} results).`);
}

main();
