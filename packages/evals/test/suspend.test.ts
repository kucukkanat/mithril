import { expect, test } from "bun:test";
import { agent, tool } from "@mithril/core/agent";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { completed, runEval } from "../src/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

// A run that calls an approval-gated `deploy`, then answers "Done" on the next turn.
function scenario() {
  const record: { executed: boolean; input: unknown } = { executed: false, input: undefined };
  const deploy = tool({
    name: "deploy",
    description: "deploy to an environment",
    inputSchema: schema<{ env: string }>(),
    needsApproval: true,
    execute: async ({ env }) => {
      record.executed = true;
      record.input = env;
      return { ok: true, env };
    },
  });
  const turns: ProviderChunk[][] = [
    [{ type: "tool.call", callId: "c1", name: "deploy", input: { env: "prod" } }, { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: "Done" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }],
  ];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "help", tools: [deploy] });
  return { a, record };
}

async function runOne(onSuspend: "reject" | "approve" | undefined) {
  const { a, record } = scenario();
  const cases = [{ name: "gated", input: "deploy to prod", scorers: [completed()] }];
  const opts = onSuspend === undefined ? { deps: undefined } : { deps: undefined, onSuspend };
  let run;
  for await (const r of runEval(a, cases, opts)) run = r;
  if (run === undefined) throw new Error("no run");
  return { run, record };
}

test("default policy auto-rejects: the run RESOLVES to completed (not frozen at suspend) without executing the tool", async () => {
  const { run, record } = await runOne(undefined);
  // The regression this guards: without the resume loop, final.status would be "suspended" and "Done" would
  // never be captured. It reaches completed because the auto-reject resolves the suspension.
  expect(run.trajectory.final.status).toBe("completed");
  expect(record.executed).toBe(false); // rejected → the gated tool never ran
  expect(run.scores.find((s) => s.name === "completed")?.value).toBe(1);
});

test("onSuspend: 'reject' matches the default", async () => {
  const { run, record } = await runOne("reject");
  expect(run.trajectory.final.status).toBe("completed");
  expect(record.executed).toBe(false);
});

test("onSuspend: 'approve' executes the gated tool and completes", async () => {
  const { run, record } = await runOne("approve");
  expect(run.trajectory.final.status).toBe("completed");
  expect(record.executed).toBe(true);
  expect(record.input).toBe("prod");
});
