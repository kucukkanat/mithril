import { expect, test } from "bun:test";
import { agent } from "@mithril/core/agent";
import type { ProviderChunk, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { completed, pairwiseJudge, runEval, type Trajectory } from "../src/index.ts";

const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

const textTurns = (text: string): ProviderChunk[][] => [[{ type: "text.delta", delta: text }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }]];

async function textTraj(text: string): Promise<Trajectory> {
  const a = agent({ model: testModel(scriptedProvider(textTurns(text))), instructions: "help" });
  let traj: Trajectory | undefined;
  for await (const r of runEval(a, [{ name: "f", input: "go", scorers: [completed()] }], { deps: undefined })) traj = r.trajectory;
  if (traj === undefined) throw new Error("no trajectory");
  return traj;
}

// A judge whose (scripted) verdict is fixed, regardless of the prompt it receives.
const judgeModel = (verdict: string) => testModel(scriptedProvider(textTurns(`{"winner":"${verdict}","rationale":"because"}`)));

test("pairwiseJudge maps A → 1, B → 0, tie → 0.5", async () => {
  const [a, b] = [await textTraj("answer A"), await textTraj("answer B")];
  expect((await pairwiseJudge({ model: judgeModel("A"), rubric: "which is better?" })(a, b)).value).toBe(1);
  expect((await pairwiseJudge({ model: judgeModel("B"), rubric: "which is better?" })(a, b)).value).toBe(0);
  expect((await pairwiseJudge({ model: judgeModel("tie"), rubric: "which is better?" })(a, b)).value).toBe(0.5);
});

test("pairwiseJudge carries the judge's rationale and honors a custom name", async () => {
  const [a, b] = [await textTraj("answer A"), await textTraj("answer B")];
  const s = await pairwiseJudge({ model: judgeModel("A"), rubric: "r", name: "quality" })(a, b);
  expect(s.name).toBe("quality");
  expect(s.rationale).toBe("because");
});

test("pairwiseJudge is neutral (0.5) when the judge returns non-JSON", async () => {
  const [a, b] = [await textTraj("answer A"), await textTraj("answer B")];
  const bad = testModel(scriptedProvider(textTurns("not json at all")));
  expect((await pairwiseJudge({ model: bad, rubric: "r" })(a, b)).value).toBe(0.5);
});
