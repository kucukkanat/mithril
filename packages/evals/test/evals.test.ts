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
