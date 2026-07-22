import { expect, test } from "bun:test";
import { agent, defaultRuntime, tool } from "@mithril/core/agent";
import type { ChatRequest, ProviderChunk, RuntimeAdapter, StandardSchemaV1, Transport } from "@mithril/core/protocol";
import { anthropic, anthropicProvider } from "../src/anthropic/index.ts";

function sse(lines: readonly string[]): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const l of lines) c.enqueue(enc.encode(l));
      c.close();
    },
  });
  return new Response(body, { status: 200 });
}
function runtimeReturning(responses: readonly (() => Response)[]): RuntimeAdapter {
  let i = 0;
  return {
    ...defaultRuntime(),
    fetch: (async () => {
      const make = responses[i] ?? responses[responses.length - 1];
      i++;
      return make?.() ?? new Response(null, { status: 500 });
    }) as typeof fetch,
  };
}
function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const TRANSPORT: Transport = { kind: "byok", apiKey: "k" };
const REQ: ChatRequest = { model: "anthropic/claude-x", system: "", messages: [], tools: [] };
const signal = new AbortController().signal;
const ev = (obj: unknown): string => `event: x\ndata: ${JSON.stringify(obj)}\n\n`;

test("parses Anthropic text streaming", async () => {
  const rt = runtimeReturning([
    () =>
      sse([
        ev({ type: "message_start", message: { usage: { input_tokens: 3 } } }),
        ev({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Hi" } }),
        ev({ type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 1 } }),
        ev({ type: "message_stop" }),
      ]),
  ]);
  const chunks: ProviderChunk[] = [];
  for await (const c of anthropicProvider().chat(REQ, rt, TRANSPORT, signal)) chunks.push(c);
  expect(chunks[0]).toEqual({ type: "text.delta", delta: "Hi" });
  expect(chunks.at(-1)).toMatchObject({ type: "message.end", finishReason: "stop" });
});

test("drives the full loop through Anthropic (tool_use → text)", async () => {
  let seen = "";
  const weather = tool({ name: "weather", description: "", inputSchema: schema<{ city: string }>(), execute: async ({ city }) => { seen = city; return { city }; } });
  const rt = runtimeReturning([
    () =>
      sse([
        ev({ type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "t1", name: "weather" } }),
        ev({ type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '{"city":"NYC"}' } }),
        ev({ type: "message_delta", delta: { stop_reason: "tool_use" }, usage: { output_tokens: 2 } }),
      ]),
    () => sse([ev({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Sunny" } }), ev({ type: "message_delta", delta: { stop_reason: "end_turn" } })]),
  ]);
  const a = agent({ model: anthropic("claude-x"), instructions: "x", tools: [weather] });
  const res = await a.run("weather?", { deps: undefined, runtime: rt, transport: TRANSPORT });
  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("Sunny");
  expect(seen).toBe("NYC");
});

test("an empty byok key throws an actionable error before any request goes out", async () => {
  let fetched = false;
  const rt: RuntimeAdapter = { ...defaultRuntime(), fetch: (async () => { fetched = true; return new Response(null, { status: 200 }); }) as typeof fetch };
  const gen = anthropicProvider().chat(REQ, rt, { kind: "byok", apiKey: "" }, signal);
  await expect(gen.next()).rejects.toThrow(/ANTHROPIC_API_KEY/);
  expect(fetched).toBe(false);
});
