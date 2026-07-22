import { expect, test } from "bun:test";
import { agent, tool } from "@mithril/core/agent";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { calledTool, calledToolWith, completed, describeEval, runEval, type Scorer } from "../src/index.ts";

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

test("runEval scores a trajectory (tool selection + completion)", async () => {
  const outputSays: Scorer = (t) => ({
    name: "final-text",
    value: t.final.messages.some((m) => m.content.includes("answer")) ? 1 : 0,
  });
  const cases = [{ name: "search-then-answer", input: "go", scorers: [calledTool("search"), completed(), outputSays] }];

  const runs = [];
  for await (const r of runEval(makeAgent(), cases, { deps: undefined })) runs.push(r);

  expect(runs).toHaveLength(1);
  expect(runs[0]?.passed).toBe(true);
  expect(runs[0]?.scores.map((s) => s.value)).toEqual([1, 1, 1]);
});

test("calledToolWith checks the call's arguments", async () => {
  // makeAgent's scripted turn calls search with input { q: "x" }.
  const runs = [];
  for await (const r of runEval(
    makeAgent(),
    [{ name: "args", input: "go", scorers: [calledToolWith("search", (i) => (i as { q?: string }).q === "x"), calledToolWith("search", (i) => (i as { q?: string }).q === "nope")] }],
    { deps: undefined },
  )) {
    runs.push(r);
  }
  expect(runs[0]?.scores.map((s) => s.value)).toEqual([1, 0]);
});

// describeEval registers a bun:test test per case; a failing scorer would fail the run.
describeEval(
  test,
  makeAgent(),
  [{ name: "uses-search", input: "go", scorers: [calledTool("search")] }],
  { deps: undefined },
);

test("trajectory scorers: order, count, no-errors, text, budget", async () => {
  const {
    calledInOrder, toolCallCount, noToolErrors, outputIncludes, outputMatches, finalText, underSteps,
  } = await import("../src/index.ts");
  const cases = [{
    name: "scorer-library",
    input: "go",
    scorers: [
      calledInOrder(["search"]),
      calledInOrder(["book", "search"]), // wrong order → 0
      toolCallCount(1),
      toolCallCount({ min: 2 }), // only 1 call → 0
      noToolErrors(),
      outputIncludes("answer"),
      outputIncludes("ANSWER", { ignoreCase: true }),
      outputMatches(/ans\w+/),
      underSteps(16),
    ],
  }];
  const runs = [];
  for await (const r of runEval(makeAgent(), cases, { deps: undefined })) runs.push(r);
  expect(runs[0]?.scores.map((s) => s.value)).toEqual([1, 0, 1, 0, 1, 1, 1, 1, 1]);
  // finalText helper folds the deltas
  expect(finalText(runs[0]!.trajectory)).toBe("answer");
});

test("calledToolWith accepts the tool value and infers its input type (rename-safe)", async () => {
  const search = tool({ name: "search", description: "", inputSchema: schema<{ q: string }>(), execute: async () => ({ hits: [] }) });
  const turns: ProviderChunk[][] = [
    [{ type: "tool.call", callId: "c1", name: "search", input: { q: "x" } }, { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: "done" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }],
  ];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "help", tools: [search] });
  const runs = [];
  // `i` is typed { q: string } — no cast — from the tool value.
  for await (const r of runEval(a, [{ name: "typed", input: "go", scorers: [calledToolWith(search, (i) => i.q === "x")] }])) runs.push(r);
  expect(runs[0]?.scores[0]?.value).toBe(1);
});

test("runSuite runs a matrix, aggregates, and gates on minPassRate", async () => {
  const { runSuite } = await import("../src/index.ts");
  const a = makeAgent();
  const b = makeAgent();
  const cases = [{ name: "uses-search", input: "go", scorers: [calledTool("search")] }];
  const failing = [{ name: "impossible", input: "go", scorers: [calledTool("nonexistent")] }];
  const result = await runSuite([
    { label: "A", agent: a, cases },
    { label: "B", agent: b, cases: failing },
  ], { minPassRate: 0.8 });
  expect(result.total).toBe(2);
  expect(result.passed).toBe(1);
  expect(result.passRate).toBe(0.5);
  expect(result.ok).toBe(false); // 0.5 < 0.8 gate
  expect(result.runs.map((r) => r.group)).toEqual(["A", "B"]);
  expect(result.runs.every((r) => typeof r.durationMs === "number")).toBe(true);
});

test("llmJudge runs a judge model and parses its score", async () => {
  const { llmJudge } = await import("../src/index.ts");
  // A scripted judge that "grades" by emitting the JSON verdict.
  const judgeModel = testModel(scriptedProvider([[
    { type: "text.delta", delta: '{"score": 1, "rationale": "accurate"}' },
    { type: "message.end", usage: NO_USAGE, finishReason: "stop" },
  ]]));
  const scorer = llmJudge({ model: judgeModel, rubric: "Is it correct?", name: "correct" });
  const runs = [];
  for await (const r of runEval(makeAgent(), [{ name: "judged", input: "go", scorers: [scorer] }])) runs.push(r);
  expect(runs[0]?.scores[0]?.name).toBe("correct");
  expect(runs[0]?.scores[0]?.value).toBe(1);
  expect(runs[0]?.scores[0]?.rationale).toBe("accurate");
});
