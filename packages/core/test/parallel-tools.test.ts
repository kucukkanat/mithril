import { expect, test } from "bun:test";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { agent, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };
const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// One turn that fires three independent tool calls, then a turn that answers with text.
function threeCallTurns(names: readonly [string, string, string]): ProviderChunk[][] {
  return [
    [
      { type: "tool.call", callId: "c1", name: names[0], input: { i: 1 } },
      { type: "tool.call", callId: "c2", name: names[1], input: { i: 2 } },
      { type: "tool.call", callId: "c3", name: names[2], input: { i: 3 } },
      { type: "message.end", usage: NO, finishReason: "tool_calls" },
    ],
    [{ type: "text.delta", delta: "done" }, { type: "message.end", usage: NO, finishReason: "stop" }],
  ];
}

test("independent tool calls in a turn execute concurrently (overlap > 1 in flight)", async () => {
  let inflight = 0;
  let maxInflight = 0;
  const t = tool({
    name: "t",
    description: "x",
    inputSchema: schema<{ i: number }>(),
    execute: async ({ i }) => {
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      await delay(20); // hold the slot so siblings can start too
      inflight -= 1;
      return { i };
    },
  });
  const res = await agent({ model: testModel(scriptedProvider(threeCallTurns(["t", "t", "t"]))), instructions: "", tools: [t] }).run("go");
  expect(res.status).toBe("completed");
  expect(maxInflight).toBe(3); // all three overlapped — sequential would cap at 1
});

test("maxConcurrentTools: 1 restores strictly sequential execution", async () => {
  let inflight = 0;
  let maxInflight = 0;
  const t = tool({
    name: "t",
    description: "x",
    inputSchema: schema<{ i: number }>(),
    execute: async ({ i }) => {
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      await delay(5);
      inflight -= 1;
      return { i };
    },
  });
  const res = await agent({
    model: testModel(scriptedProvider(threeCallTurns(["t", "t", "t"]))),
    instructions: "",
    tools: [t],
    maxConcurrentTools: 1,
  }).run("go");
  expect(res.status).toBe("completed");
  expect(maxInflight).toBe(1);
});

test("results commit in CALL order even when execution finishes out of order", async () => {
  // c3 finishes first (0ms), c1 last (20ms) — but tool.result events must appear as c1, c2, c3.
  const t = tool({
    name: "t",
    description: "x",
    inputSchema: schema<{ i: number }>(),
    execute: async ({ i }) => {
      await delay((3 - i) * 10);
      return { i };
    },
  });
  const seen: string[] = [];
  const a = agent({ model: testModel(scriptedProvider(threeCallTurns(["t", "t", "t"]))), instructions: "", tools: [t] });
  for await (const e of a.stream("go")) if (e.type === "tool.result") seen.push(e.callId);
  expect(seen).toEqual(["c1", "c2", "c3"]);
});

test("a Tier-1 approval barrier does not speculatively run later tool calls", async () => {
  const ran = new Set<number>();
  const safe = tool({
    name: "safe",
    description: "no approval",
    inputSchema: schema<{ i: number }>(),
    execute: async ({ i }) => {
      ran.add(i);
      return { i };
    },
  });
  const danger = tool({
    name: "danger",
    description: "needs approval",
    inputSchema: schema<{ i: number }>(),
    needsApproval: true,
    execute: async ({ i }) => {
      ran.add(i);
      return { i };
    },
  });
  // Turn order: safe(c1) → danger(c2, gated) → safe(c3). c1 runs, c2 suspends, c3 must NOT run.
  const res = await agent({
    model: testModel(scriptedProvider(threeCallTurns(["safe", "danger", "safe"]))),
    instructions: "",
    tools: [safe, danger],
  }).run("go");
  expect(res.status).toBe("suspended");
  if (res.status === "suspended") expect(res.request.kind).toBe("tool.approval");
  expect(ran.has(1)).toBe(true); // the call before the gate ran
  expect(ran.has(3)).toBe(false); // the call after the gate was NOT speculatively executed
});
