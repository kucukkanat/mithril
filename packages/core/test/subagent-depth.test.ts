import { expect, test } from "bun:test";
import type { MithrilEvent, Provider, ProviderChunk, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { agent, asTool, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

/*
 * Nested delegation: agent → sub-agent → sub-sub-agent, each calling a real tool.
 *
 * Delegation is where "it called the tool" stops being one boolean. The leaf's tool must actually execute,
 * its value must climb back through every wrapper, a failure at depth must surface as a typed error rather
 * than an empty-but-successful answer, and the tokens spent down there must be charged to the run on top.
 */

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };
const U = (n: number): UsageDelta => ({ input: n, output: n, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: n });

const callThen = (name: string, answer: string): (readonly ProviderChunk[])[] => [
  [{ type: "tool.call", callId: "c1", name, input: { task: "go" } }, { type: "message.end", usage: NO, finishReason: "tool_calls" }],
  [{ type: "text.delta", delta: answer }, { type: "message.end", usage: NO, finishReason: "stop" }],
];

test("a tool three levels down executes, and its value climbs back to the root", async () => {
  let ran = 0;
  const leafTool = tool({
    name: "leaf",
    description: "the real work",
    inputSchema: schema<{ task: string }>(),
    execute: async () => {
      ran++;
      return { answer: 42 };
    },
  });

  const grandchild = agent({ model: testModel(scriptedProvider(callThen("leaf", "leaf says 42"))), instructions: "gc", tools: [leafTool] });
  const child = agent({
    model: testModel(scriptedProvider(callThen("delegate_gc", "child relays 42"))),
    instructions: "c",
    tools: [asTool(grandchild, { name: "delegate_gc", description: "ask the grandchild" })],
  });
  const root = agent({
    model: testModel(scriptedProvider(callThen("delegate_child", "root relays 42"))),
    instructions: "r",
    tools: [asTool(child, { name: "delegate_child", description: "ask the child" })],
  });

  const res = await root.run("go", { deps: undefined });
  expect(ran).toBe(1); // exactly once — journaling must not re-run it
  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("root relays 42");
});

test("a sub-agent that fails surfaces as a typed SUBAGENT_ERROR, never as a successful empty answer", async () => {
  // The grandchild's provider dies mid-stream, so its run ends in `error`.
  const dying: Provider = {
    spec: { id: "test", models: {} },
    // eslint-disable-next-line require-yield
    async *chat() {
      throw new Error("upstream exploded");
    },
  };
  const grandchild = agent({ model: testModel(dying), instructions: "gc", tools: [] });
  const root = agent({
    model: testModel(scriptedProvider(callThen("delegate", "unreachable"))),
    instructions: "r",
    tools: [asTool(grandchild, { name: "delegate", description: "ask" })],
  });

  const events: MithrilEvent[] = [];
  for await (const ev of root.stream("go", { deps: undefined })) events.push(ev);

  const errors = events.flatMap((e) => (e.type === "tool.error" ? [e.error] : []));
  expect(errors).toHaveLength(1);
  expect(errors[0]?.message).toContain("upstream exploded");
  // The failure is reported as an error, not laundered into a tool.result the model would treat as data.
  expect(events.filter((e) => e.type === "tool.result")).toHaveLength(0);
});

test("tokens spent by a sub-agent are charged to the parent run", async () => {
  const child = agent({
    model: testModel(scriptedProvider([[{ type: "text.delta", delta: "hi" }, { type: "message.end", usage: U(100), finishReason: "stop" }]])),
    instructions: "c",
    tools: [],
  });
  const root = agent({
    model: testModel(
      scriptedProvider([
        [{ type: "tool.call", callId: "c1", name: "d", input: { task: "go" } }, { type: "message.end", usage: U(1), finishReason: "tool_calls" }],
        [{ type: "text.delta", delta: "ok" }, { type: "message.end", usage: U(1), finishReason: "stop" }],
      ]),
    ),
    instructions: "r",
    tools: [asTool(child, { name: "d", description: "d" })],
  });

  const res = await root.run("go", { deps: undefined });
  // 1 + 1 from the root's own two turns, plus the child's 100 — not 2.
  expect(res.usage.input).toBe(102);
  expect(res.usage.costMicroUsd).toBe(102);
});

test("a sub-agent's spend counts against the parent's budget", async () => {
  const greedy = agent({
    model: testModel(scriptedProvider([[{ type: "text.delta", delta: "hi" }, { type: "message.end", usage: U(5_000), finishReason: "stop" }]])),
    instructions: "c",
    tools: [],
  });
  const root = agent({
    model: testModel(
      scriptedProvider([
        [{ type: "tool.call", callId: "c1", name: "d", input: { task: "go" } }, { type: "message.end", usage: U(1), finishReason: "tool_calls" }],
        [{ type: "text.delta", delta: "should never be reached" }, { type: "message.end", usage: U(1), finishReason: "stop" }],
      ]),
    ),
    instructions: "r",
    tools: [asTool(greedy, { name: "d", description: "d" })],
    maxTokens: 1_000,
  });

  const events: MithrilEvent[] = [];
  for await (const ev of root.stream("go", { deps: undefined })) events.push(ev);

  // Delegated spend blew the budget; the run must stop rather than continue on an unbounded sub-agent.
  expect(events.some((e) => e.type === "budget.exceeded")).toBe(true);
});
