import { expect, test } from "bun:test";
import type { MithrilEvent, ProviderChunk, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { narrow } from "../src/protocol/index.ts";
import { agent, agentLoop } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";
import { tool } from "../src/agent/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

// A two-turn conversation: the model calls the `weather` tool, then answers with text.
function turns(): ProviderChunk[][] {
  return [
    [
      { type: "tool.call", callId: "c1", name: "weather", input: { city: "NYC" } },
      { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" },
    ],
    [
      { type: "text.delta", delta: "It is " },
      { type: "text.delta", delta: "sunny" },
      { type: "message.end", usage: NO_USAGE, finishReason: "stop" },
    ],
  ];
}

function makeAgentUnderTest(onExecute: (city: string) => void) {
  const weather = tool({
    name: "weather",
    description: "current weather",
    inputSchema: schema<{ city: string }>(),
    execute: async ({ city }) => {
      onExecute(city);
      return { temp: 20, city };
    },
  });
  return agent({ model: testModel(scriptedProvider(turns())), instructions: "be helpful", tools: [weather] });
}

test("run() drives the loop: calls the tool, then completes with the text answer", async () => {
  let seen = "";
  const res = await makeAgentUnderTest((c) => {
    seen = c;
  }).run("weather in NYC?");
  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("It is sunny");
  expect(seen).toBe("NYC"); // the tool actually executed with the model's arguments
});

test("agentLoop emits a well-formed, monotonic event stream", async () => {
  const weather = tool({
    name: "weather",
    description: "",
    inputSchema: schema<{ city: string }>(),
    execute: async ({ city }) => ({ city }),
  });
  const gen = agentLoop({
    model: testModel(scriptedProvider(turns())),
    instructions: "be helpful",
    tools: [weather],
    input: "weather?",
    deps: undefined,
  });

  const events: MithrilEvent[] = [];
  for (;;) {
    const r = await gen.next();
    if (r.done) break;
    events.push(r.value);
  }

  const types = events.map((e) => e.type);
  expect(types[0]).toBe("run.start");
  expect(types).toContain("tool.call");
  expect(types).toContain("tool.result");
  expect(types.at(-1)).toBe("run.finish");
  // seq is gap-free and monotonic from 0
  events.forEach((e, i) => expect(e.seq).toBe(i));
  // narrow works on the REAL emitted tool.call
  const call = events.find((e) => e.type === "tool.call");
  expect(call !== undefined && narrow(call, [weather] as const)).toBe(true);
});

test("stream() yields the text tier and resolves a result", async () => {
  const handle = makeAgentUnderTest(() => {}).stream("weather?");
  expect(typeof handle.runId).toBe("string");
  let text = "";
  for await (const delta of handle.text) text += delta;
  expect(text).toBe("It is sunny");
  const res = await handle.result();
  expect(res.status).toBe("completed");
});
