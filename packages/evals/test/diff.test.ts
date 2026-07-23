import { expect, test } from "bun:test";
import { agent, tool } from "@mithril/core/agent";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { completed, diffRuns, runEval, runSuite, type RunSnapshot, toSnapshot } from "../src/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

function makeAgent() {
  const search = tool({ name: "search", description: "", inputSchema: schema<{ q: string }>(), execute: async () => ({ hits: [] }) });
  const turns: ProviderChunk[][] = [
    [{ type: "tool.call", callId: "c1", name: "search", input: { q: "x" } }, { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: "answer" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }],
  ];
  return agent({ model: testModel(scriptedProvider(turns)), instructions: "help", tools: [search] });
}

const snap = (runs: RunSnapshot["runs"]): RunSnapshot => ({ generatedAt: "t", runs });

test("diffRuns classifies improved / regressed / added / removed", () => {
  const base = snap([
    { case: "a", passed: true, scores: [] },
    { case: "b", passed: false, scores: [] },
    { case: "c", passed: true, scores: [] },
  ]);
  const cur = snap([
    { case: "a", passed: false, scores: [] }, // regressed
    { case: "b", passed: true, scores: [] }, // improved
    { case: "d", passed: true, scores: [] }, // added
  ]);
  const d = diffRuns(base, cur);
  expect(d.regressed).toEqual(["a"]);
  expect(d.improved).toEqual(["b"]);
  expect(d.added).toEqual(["d"]);
  expect(d.removed).toEqual(["c"]); // present in base, gone in current
});

test("diffRuns keys grouped rows by group::case", () => {
  const base = snap([
    { case: "x", group: "m1", passed: true, scores: [] },
    { case: "x", group: "m2", passed: true, scores: [] },
  ]);
  const cur = snap([
    { case: "x", group: "m1", passed: false, scores: [] },
    { case: "x", group: "m2", passed: true, scores: [] },
  ]);
  expect(diffRuns(base, cur).regressed).toEqual(["m1::x"]);
});

test("toSnapshot summarizes runEval results (no group, generatedAt overridable)", async () => {
  const runs = [];
  for await (const r of runEval(makeAgent(), [{ name: "f", input: "go", scorers: [completed()] }], { deps: undefined })) runs.push(r);
  const s = toSnapshot(runs, { generatedAt: "fixed" });
  expect(s.generatedAt).toBe("fixed");
  expect(s.runs[0]).toMatchObject({ case: "f", passed: true });
  expect(s.runs[0]?.group).toBeUndefined();
  expect(s.runs[0]?.scores).toEqual([{ name: "completed", value: 1 }]);
});

test("toSnapshot carries the group off SuiteRuns", async () => {
  const result = await runSuite(
    [
      { label: "m1", agent: makeAgent(), cases: [{ name: "f", input: "go", scorers: [completed()] }] },
      { label: "m2", agent: makeAgent(), cases: [{ name: "f", input: "go", scorers: [completed()] }] },
    ],
    { minPassRate: 0 },
  );
  const s = toSnapshot(result.runs);
  expect(s.runs.map((r) => r.group).sort()).toEqual(["m1", "m2"]);
  // round-trips through a diff: identical snapshots have no changes
  expect(diffRuns(s, s)).toEqual({ improved: [], regressed: [], added: [], removed: [] });
});
