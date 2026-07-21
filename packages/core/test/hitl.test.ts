import { expect, test } from "bun:test";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { agent, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

function turns(): ProviderChunk[][] {
  return [
    [
      { type: "tool.call", callId: "c1", name: "deploy", input: { env: "prod" } },
      { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" },
    ],
    [
      { type: "text.delta", delta: "Done" },
      { type: "message.end", usage: NO_USAGE, finishReason: "stop" },
    ],
  ];
}

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
  const a = agent({ model: testModel(scriptedProvider(turns())), instructions: "help", tools: [deploy] });
  return { a, record };
}

test("a needsApproval tool suspends BEFORE executing", async () => {
  const { a, record } = scenario();
  const r = await a.run("deploy to prod");
  expect(r.status).toBe("suspended");
  expect(record.executed).toBe(false); // the whole point: nothing ran
  if (r.status === "suspended") {
    expect(r.request.kind).toBe("tool.approval");
    expect(r.request.payload).toEqual({ name: "deploy", input: { env: "prod" } });
    expect(typeof r.token).toBe("string");
  }
});

test("resume(approve) executes the tool and completes", async () => {
  const { a, record } = scenario();
  const r = await a.run("deploy to prod");
  if (r.status !== "suspended") throw new Error("expected suspended");
  const done = await a.resume(r.token, { kind: "approve" });
  expect(done.status).toBe("completed");
  if (done.status === "completed") expect(done.output).toBe("Done");
  expect(record.executed).toBe(true);
  expect(record.input).toBe("prod");
});

test("resume(reject) completes WITHOUT executing the tool", async () => {
  const { a, record } = scenario();
  const r = await a.run("deploy to prod");
  if (r.status !== "suspended") throw new Error("expected suspended");
  const done = await a.resume(r.token, { kind: "reject", message: "not now" });
  expect(done.status).toBe("completed");
  expect(record.executed).toBe(false);
});

test("resume(edit) executes with the edited input", async () => {
  const { a, record } = scenario();
  const r = await a.run("deploy to prod");
  if (r.status !== "suspended") throw new Error("expected suspended");
  const done = await a.resume(r.token, { kind: "edit", input: { env: "staging" } });
  expect(done.status).toBe("completed");
  expect(record.executed).toBe(true);
  expect(record.input).toBe("staging"); // ran with the human's edit, not the model's args
});
