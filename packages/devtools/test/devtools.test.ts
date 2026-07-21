import { expect, test } from "bun:test";
import { agent, tool } from "@mithril/core/agent";
import type { Middleware, Plugin, ProviderChunk, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { createInspector, devtoolsPlugin, getGlobalInspector } from "../src/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

function weatherAgent(use: readonly (Plugin<void> | Middleware<void>)[]) {
  const weather = tool({ name: "weather", description: "", inputSchema: schema<{ city: string }>(), execute: async ({ city }) => ({ city }) });
  const turns: ProviderChunk[][] = [
    [{ type: "tool.call", callId: "c1", name: "weather", input: { city: "NYC" } }, { type: "message.end", usage: NO, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: "sunny" }, { type: "message.end", usage: NO, finishReason: "stop" }],
  ];
  return agent({ model: testModel(scriptedProvider(turns)), instructions: "help", tools: [weather], use });
}

test("inspector captures a run's events, replayed state, and timeline", async () => {
  const inspector = createInspector();
  await weatherAgent([{ name: "dev", consumers: [inspector.consumer] }]).run("weather?");

  const run = inspector.latest();
  expect(run).toBeDefined();
  expect(run?.state.status).toBe("completed");
  expect(run?.timeline[0]?.type).toBe("run.start");
  expect(run?.timeline.at(-1)?.type).toBe("run.finish");
  expect(run?.timeline.some((t) => t.type === "tool.call")).toBe(true);
  // timeline seqs are contiguous from 0
  run?.timeline.forEach((t, i) => expect(t.seq).toBe(i));
});

test("devtoolsPlugin bundles the inspector for use:", async () => {
  const dev = devtoolsPlugin();
  await weatherAgent([dev]).run("weather?");
  expect(dev.inspector.latest()?.state.status).toBe("completed");
  expect(dev.inspector.runIds().length).toBe(1);
});

test("maxRuns evicts the oldest run", async () => {
  const inspector = createInspector({ maxRuns: 1 });
  const use = [{ name: "dev", consumers: [inspector.consumer] }];
  await weatherAgent(use).run("one");
  await weatherAgent(use).run("two");
  expect(inspector.runIds().length).toBe(1); // only the most recent retained
});

test("getGlobalInspector returns a stable shared instance", () => {
  expect(getGlobalInspector()).toBe(getGlobalInspector());
});
