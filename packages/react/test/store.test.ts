import { expect, test } from "bun:test";
import { agent, tool } from "@mithril/core/agent";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { createRunStore } from "../src/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

test("createRunStore accumulates text and reaches completed", async () => {
  const echo = tool({ name: "echo", description: "", inputSchema: schema<{ s: string }>(), execute: async () => ({}) });
  const turns: ProviderChunk[][] = [[{ type: "text.delta", delta: "Hel" }, { type: "text.delta", delta: "lo" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }]];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "x", tools: [echo] });

  const store = createRunStore(a.stream("go").events);
  // wait for the stream to drain
  await new Promise((r) => setTimeout(r, 30));

  const snap = store.getSnapshot();
  expect(snap.text).toBe("Hello");
  expect(snap.status).toBe("completed");
  expect(snap.events.length).toBeGreaterThan(0);
});

test("subscribers are notified as events arrive", async () => {
  const echo = tool({ name: "echo", description: "", inputSchema: schema<{ s: string }>(), execute: async () => ({}) });
  const turns: ProviderChunk[][] = [[{ type: "text.delta", delta: "x" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }]];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "x", tools: [echo] });

  const store = createRunStore(a.stream("go").events);
  let notifications = 0;
  const unsub = store.subscribe(() => notifications++);
  await new Promise((r) => setTimeout(r, 30));
  unsub();
  expect(notifications).toBeGreaterThan(0);
});
