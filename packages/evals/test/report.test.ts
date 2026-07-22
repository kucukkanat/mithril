import { expect, test } from "bun:test";
import { htmlReport, inspectorReport, type EvalReportEntry, type EvalRun } from "../src/index.ts";

// Build an EvalRun without running an agent — the report only reads case/scores/passed + log + final.
function makeRun(name: string, passed: boolean, opts: { text?: string; tool?: { name: string; input: unknown }; score?: { name: string; value: number } }): EvalRun {
  const log: unknown[] = [];
  if (opts.text !== undefined) log.push({ type: "text.delta", delta: opts.text });
  if (opts.tool !== undefined) log.push({ type: "tool.call", callId: "c1", name: opts.tool.name, input: opts.tool.input });
  return {
    case: name,
    passed,
    scores: [opts.score ?? { name: "completed", value: passed ? 1 : 0 }],
    trajectory: { runId: `r_${name}`, log, final: { status: passed ? "completed" : "failed", usage: { costMicroUsd: 1200 } } },
  } as unknown as EvalRun;
}

test("htmlReport: self-contained document with stats, controls, and rows", () => {
  const entries: EvalReportEntry[] = [
    { run: makeRun("chat", true, { text: "Hello there", score: { name: "completed", value: 1 } }), group: "qwen3", durationMs: 1200 },
    { run: makeRun("tool-call", false, { tool: { name: "weather", input: { city: "Istanbul" } }, score: { name: "called:weather", value: 0 } }), group: "qwen3", durationMs: 800 },
    { run: makeRun("greet", true, { text: "hi" }), group: "lfm" },
  ];
  const html = htmlReport(entries, { title: "Test Report", generatedAt: "2026-07-21T00:00:00Z" });

  expect(html.startsWith("<!doctype html>")).toBe(true);
  expect(html).toContain("<title>Test Report</title>");
  // controls: search + filters + group select
  expect(html).toContain('id="q"');
  expect(html).toContain('data-filter="pass"');
  expect(html).toContain('data-filter="fail"');
  expect(html).toContain('<option value="lfm">');
  // summary stats: 3 cases, 2 passed, 1 failed
  expect(html).toContain("<b>3</b> cases");
  expect(html).toContain("<b>2</b> passed");
  expect(html).toContain("<b>1</b> failed");
  // rows carry filter metadata
  expect(html).toContain('data-status="pass"');
  expect(html).toContain('data-status="fail"');
  expect(html).toContain('data-group="qwen3"');
  // content surfaced
  expect(html).toContain("called:weather");
  expect(html).toContain("weather(");
  expect(html).toContain("Hello there");
});

test("htmlReport: escapes untrusted output (no XSS)", () => {
  const html = htmlReport([{ run: makeRun("xss <b>", true, { text: "<img src=x onerror=alert(1)>" }) }]);
  // the payload must be escaped, never emitted raw
  expect(html).not.toContain("<img src=x onerror=alert(1)>");
  expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  expect(html).toContain("xss &lt;b&gt;");
});

test("htmlReport: empty input renders an empty state", () => {
  const html = htmlReport([]);
  expect(html).toContain("<b>0</b> cases");
  expect(html).toContain("No eval cases");
});

test("inspectorReport: self-contained doc that inlines the devtools inspector + embeds each trajectory", async () => {
  const entries: EvalReportEntry[] = [
    { run: makeRun("chat", true, { text: "Hello there" }), group: "qwen3", durationMs: 1200 },
    { run: makeRun("tool-call", false, { tool: { name: "weather", input: { city: "Istanbul" } }, score: { name: "called:weather", value: 0 } }), group: "qwen3" },
  ];
  const html = await inspectorReport(entries, { title: "Inspector Report", generatedAt: "2026-07-21T00:00:00Z" });

  expect(html.startsWith("<!doctype html>")).toBe(true);
  expect(html).toContain("<title>Inspector Report</title>");
  // the same header/stats/controls shell as htmlReport
  expect(html).toContain("<b>2</b> cases");
  expect(html).toContain('data-filter="fail"');
  // devtools stylesheet is inlined (its classes are namespaced .mth-dev-*)
  expect(html).toContain("mth-dev");
  // the bundled client + its mount points are present
  expect(html).toContain("mth-inspect");
  expect(html).toContain('class="mth-traj"');
  // each case's event log is embedded as inert JSON (a tool.call from the log surfaces here)
  expect(html).toContain('"name":"weather"');
  // self-contained: no network references
  expect(html).not.toContain("http://");
  expect(html).not.toContain("https://");
});

test("inspectorReport: escapes < in the embedded trajectory so model output cannot break out of <script>", async () => {
  const html = await inspectorReport([{ run: makeRun("xss", true, { text: "</script><script>alert(1)</script>" }) }]);
  // the raw payload must never appear as live markup…
  expect(html).not.toContain("<script>alert(1)");
  // …it is neutralised to the < escape inside the JSON island
  expect(html).toContain("\\u003cscript>alert(1)");
});

test("inspectorReport: empty input still renders a self-contained empty state", async () => {
  const html = await inspectorReport([]);
  expect(html).toContain("<b>0</b> cases");
  expect(html).toContain("No eval cases");
  expect(html).toContain("mth-dev"); // devtools assets still inlined
});
