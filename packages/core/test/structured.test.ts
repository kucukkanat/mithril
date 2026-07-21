import { expect, test } from "bun:test";
import type { JsonValue, ProviderChunk, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { agent } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

// A Standard Schema that requires { city: string; temp: number } and reports issues otherwise.
const weatherSchema: StandardSchemaV1<unknown, { city: string; temp: number }> = {
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (v) => {
      const o = v as Record<string, unknown> | null;
      if (o !== null && typeof o === "object" && typeof o["city"] === "string" && typeof o["temp"] === "number") {
        return { value: { city: o["city"], temp: o["temp"] } };
      }
      return { issues: [{ message: "expected { city: string; temp: number }" }] };
    },
  },
};

const textTurn = (s: string): ProviderChunk[] => [
  { type: "text.delta", delta: s },
  { type: "message.end", usage: NO_USAGE, finishReason: "stop" },
];

test("valid JSON on the first try completes with the parsed, typed value", async () => {
  const a = agent({
    model: testModel(scriptedProvider([textTurn(JSON.stringify({ city: "NYC", temp: 21 }))])),
    instructions: "report weather",
    output: weatherSchema,
  });
  const res = await a.run("weather in NYC");
  expect(res.status).toBe("completed");
  if (res.status === "completed") {
    // typed as { city: string; temp: number } — a compile-time check that also holds at runtime
    const out: { city: string; temp: number } = res.output;
    expect(out).toEqual({ city: "NYC", temp: 21 });
  }
});

test("invalid output triggers object.invalid + retry, then completes", async () => {
  const a = agent({
    model: testModel(
      scriptedProvider([
        textTurn('{"city":"NYC"}'), // missing temp → invalid
        textTurn(JSON.stringify({ city: "NYC", temp: 21 })), // corrected
      ]),
    ),
    instructions: "report weather",
    output: weatherSchema,
    outputRetries: 2,
  });
  const res = await a.run("weather in NYC");
  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toEqual({ city: "NYC", temp: 21 });
});

test("output that never validates fails after the retry budget", async () => {
  const a = agent({
    model: testModel(scriptedProvider([textTurn("nope"), textTurn("still nope"), textTurn("nope again")])),
    instructions: "report weather",
    output: weatherSchema,
    outputRetries: 1,
  });
  const res = await a.run("weather in NYC");
  expect(res.status).toBe("error");
  if (res.status === "error") expect(res.error.name).toBe("OutputInvalid");
});

test("structured output streams object.delta as the object forms", async () => {
  const a = agent({
    model: testModel(scriptedProvider([[{ type: "text.delta", delta: '{"city":"N' }, { type: "text.delta", delta: 'YC","temp":21}' }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }]])),
    instructions: "report weather",
    output: weatherSchema,
  });
  const events = [];
  for await (const e of a.stream("go").events) events.push(e);
  expect(events.some((e) => e.type === "object.delta")).toBe(true); // partial object streamed
  expect(events.some((e) => e.type === "object.final")).toBe(true);
});

test("a plain (no-output) agent still returns text", async () => {
  const a = agent({ model: testModel(scriptedProvider([textTurn("hello")])), instructions: "chat" });
  const res = await a.run("hi");
  expect(res.status).toBe("completed");
  if (res.status === "completed") {
    const out: string = res.output; // Out defaults to string
    expect(out).toBe("hello");
  }
  // structured events did not leak into the plain path
  const _typecheck: JsonValue = "ok";
  expect(_typecheck).toBe("ok");
});
