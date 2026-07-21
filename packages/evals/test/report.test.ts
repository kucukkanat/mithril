import { expect, test } from "bun:test";
import { htmlReport, type EvalReportEntry, type EvalRun } from "../src/index.ts";

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
