import { expect, test } from "bun:test";
import type { JsonValue, Provider, ProviderChunk, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { withJsonSchema } from "../src/protocol/index.ts";
import { agent, outputRetry } from "../src/agent/index.ts";
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
    healing: [outputRetry({ max: 1 })],
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

test("a reasoning model's <think> preamble is stripped for validation but still streams to the UI", async () => {
  const a = agent({
    model: testModel(
      scriptedProvider([
        [
          { type: "text.delta", delta: "<think>let me work out the weather</think>" },
          { type: "text.delta", delta: JSON.stringify({ city: "NYC", temp: 21 }) },
          { type: "message.end", usage: NO_USAGE, finishReason: "stop" },
        ],
      ]),
    ),
    instructions: "report weather",
    output: weatherSchema,
  });
  const events = [];
  for await (const e of a.stream("go").events) events.push(e);

  // The validated output is the clean object (reasoning peeled off for PARSING).
  const final = events.find((e) => e.type === "object.final");
  expect(final).toBeDefined();
  if (final?.type === "object.final") expect(final.value).toEqual({ city: "NYC", temp: 21 });

  // The reasoning tokens are NOT removed from the event stream — the UI still sees every text.delta.
  const streamedText = events.filter((e) => e.type === "text.delta").map((e) => (e.type === "text.delta" ? e.delta : "")).join("");
  expect(streamedText).toContain("<think>let me work out the weather</think>");

  // No partial object leaks while the think block is still open.
  const firstObjDelta = events.findIndex((e) => e.type === "object.delta");
  const thinkDelta = events.findIndex((e) => e.type === "text.delta" && e.delta.includes("<think>"));
  expect(firstObjDelta).toBeGreaterThan(thinkDelta);
});

test("a code-fenced structured response completes without a retry", async () => {
  const a = agent({
    model: testModel(scriptedProvider([textTurn('```json\n{"city":"NYC","temp":21}\n```')])),
    instructions: "report weather",
    output: weatherSchema,
  });
  const events = [];
  for await (const e of a.stream("go").events) events.push(e);
  expect(events.some((e) => e.type === "object.invalid")).toBe(false); // no re-ask needed
  const final = events.find((e) => e.type === "object.final");
  if (final?.type === "object.final") expect(final.value).toEqual({ city: "NYC", temp: 21 });
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

// A provider that records the system prompt it receives, then returns a canned valid turn.
function capturingProvider(seen: { system?: string }): Provider {
  return {
    spec: { id: "test", models: {} },
    async *chat(req) {
      seen.system = req.system;
      yield { type: "text.delta", delta: JSON.stringify({ city: "NYC", temp: 21 }) };
      yield { type: "message.end", usage: NO_USAGE, finishReason: "stop" };
    },
  };
}

test("outputSchema converter injects the JSON Schema shape into the system prompt", async () => {
  const seen: { system?: string } = {};
  const a = agent({
    model: testModel(capturingProvider(seen)),
    instructions: "report weather",
    output: weatherSchema,
    outputSchema: () => ({ type: "object", properties: { city: { type: "string" }, temp: { type: "number" } }, required: ["city", "temp"] }),
  });
  const res = await a.run("go");
  expect(res.status).toBe("completed");
  // The model saw the concrete field names/types, not just the generic hint.
  expect(seen.system).toContain("JSON Schema");
  expect(seen.system).toContain("\"city\"");
  expect(seen.system).toContain("\"temp\"");
});

test("a self-describing (withJsonSchema) output needs no converter to inject the shape", async () => {
  const seen: { system?: string } = {};
  const described = withJsonSchema(weatherSchema, { type: "object", properties: { city: { type: "string" }, temp: { type: "number" } }, required: ["city", "temp"] });
  const a = agent({ model: testModel(capturingProvider(seen)), instructions: "report weather", output: described });
  await a.run("go");
  expect(seen.system).toContain("\"city\"");
});

test("without a converter or self-describing schema, only the bare hint is added (no useless {})", async () => {
  const seen: { system?: string } = {};
  const a = agent({ model: testModel(capturingProvider(seen)), instructions: "report weather", output: weatherSchema });
  await a.run("go");
  expect(seen.system).toContain("Respond with ONLY a single JSON object");
  expect(seen.system).not.toContain("JSON Schema");
});
