import { expect, test } from "bun:test";
import { agent, defaultRuntime, tool } from "@mithril/core/agent";
import type { ChatRequest, ProviderChunk, RuntimeAdapter, StandardSchemaV1, Transport } from "@mithril/core/protocol";
import { openai, openaiProvider } from "../src/openai/index.ts";

// Build a fake SSE Response from OpenAI-shaped delta objects. This exercises the REAL parser and request
// path — only fetch is injected, so there's zero network but the streaming logic is fully under test.
function sse(objs: readonly unknown[]): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const o of objs) controller.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));
      controller.enqueue(enc.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
}

function runtimeReturning(responses: readonly (() => Response)[]): RuntimeAdapter {
  let i = 0;
  const next = responses;
  return {
    ...defaultRuntime(),
    fetch: (async () => {
      const make = next[i] ?? next[next.length - 1];
      i++;
      return make?.() ?? new Response(null, { status: 500 });
    }) as typeof fetch,
  };
}

const TRANSPORT: Transport = { kind: "byok", apiKey: "test-key" };
const REQ: ChatRequest = { model: "openai/gpt-4o", system: "", messages: [], tools: [] };
const signal = new AbortController().signal;

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}

test("parses a streamed text response into text.delta + message.end", async () => {
  const rt = runtimeReturning([
    () =>
      sse([
        { choices: [{ delta: { content: "Hello" } }] },
        { choices: [{ delta: { content: " world" } }] },
        { choices: [{ delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 5, completion_tokens: 2 } },
      ]),
  ]);
  const chunks: ProviderChunk[] = [];
  for await (const c of openaiProvider().chat(REQ, rt, TRANSPORT, signal)) chunks.push(c);

  expect(chunks).toEqual([
    { type: "text.delta", delta: "Hello" },
    { type: "text.delta", delta: " world" },
    { type: "message.end", usage: { input: 5, output: 2, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 }, finishReason: "stop" },
  ]);
});

test("accumulates streamed tool-call args into a single tool.call with parsed input", async () => {
  const rt = runtimeReturning([
    () =>
      sse([
        { choices: [{ delta: { tool_calls: [{ index: 0, id: "call_1", function: { name: "weather", arguments: '{"ci' } }] } }] },
        { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'ty":"NYC"}' } }] } }] },
        { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
      ]),
  ]);
  const chunks: ProviderChunk[] = [];
  for await (const c of openaiProvider().chat(REQ, rt, TRANSPORT, signal)) chunks.push(c);

  const call = chunks.find((c) => c.type === "tool.call");
  expect(call).toEqual({ type: "tool.call", callId: "call_1", name: "weather", input: { city: "NYC" } });
  expect(chunks.at(-1)).toMatchObject({ type: "message.end", finishReason: "tool_calls" });
});

test("drives the FULL agent loop through a real provider (tool call → text answer)", async () => {
  let seen = "";
  const weather = tool({
    name: "weather",
    description: "current weather",
    inputSchema: schema<{ city: string }>(),
    execute: async ({ city }) => {
      seen = city;
      return { temp: 20, city };
    },
  });

  const rt = runtimeReturning([
    () => sse([{ choices: [{ delta: { tool_calls: [{ index: 0, id: "call_1", function: { name: "weather", arguments: '{"city":"NYC"}' } }] } }] }, { choices: [{ delta: {}, finish_reason: "tool_calls" }] }]),
    () => sse([{ choices: [{ delta: { content: "It is sunny" } }] }, { choices: [{ delta: {}, finish_reason: "stop" }] }]),
  ]);

  const assistant = agent({ model: openai("gpt-4o"), instructions: "be helpful", tools: [weather] });
  const res = await assistant.run("weather in NYC?", { deps: undefined, runtime: rt, transport: TRANSPORT });

  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("It is sunny");
  expect(seen).toBe("NYC"); // the tool executed with the model's streamed arguments
});

test("an empty byok key throws an actionable error before any request goes out", async () => {
  let fetched = false;
  const rt: RuntimeAdapter = { ...defaultRuntime(), fetch: (async () => { fetched = true; return new Response(null, { status: 200 }); }) as typeof fetch };
  const gen = openaiProvider().chat(REQ, rt, { kind: "byok", apiKey: "" }, signal);
  await expect(gen.next()).rejects.toThrow(/OPENAI_API_KEY/);
  expect(fetched).toBe(false);
});
