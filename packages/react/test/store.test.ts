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

test("idleRunStore reports a stable empty snapshot and never notifies", async () => {
  const { idleRunStore, IDLE_SNAPSHOT } = await import("../src/index.ts");
  const store = idleRunStore();
  expect(store.getSnapshot()).toBe(IDLE_SNAPSHOT);
  expect(store.getSnapshot().text).toBe("");
  expect(store.getSnapshot().events).toEqual([]);
  let notified = false;
  const unsub = store.subscribe(() => { notified = true; });
  unsub();
  expect(notified).toBe(false);
});

test("createChatStore accumulates a multi-turn conversation", async () => {
  const { createChatStore } = await import("../src/index.ts");
  const echo = tool({ name: "echo", description: "", inputSchema: schema<{ s: string }>(), execute: async () => ({}) });
  const turns: ProviderChunk[][] = [
    [{ type: "text.delta", delta: "Hi " }, { type: "text.delta", delta: "there" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }],
  ];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "x", tools: [echo] });
  const store = createChatStore(a);
  expect(store.getSnapshot().status).toBe("idle");

  store.send("hello");
  expect(store.getSnapshot().status).toBe("streaming");
  expect(store.getSnapshot().messages).toEqual([{ role: "user", content: "hello" }]);

  await new Promise((r) => setTimeout(r, 40));
  const snap = store.getSnapshot();
  expect(snap.status).toBe("idle");
  expect(snap.messages).toEqual([
    { role: "user", content: "hello" },
    { role: "assistant", content: "Hi there" },
  ]);
  expect(snap.streaming).toBe("");
});
