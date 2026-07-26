import { expect, test } from "bun:test";
import { agent, defaultRuntime, tool } from "@mithril/core/agent";
import type { RuntimeAdapter, StandardSchemaV1, Transport } from "@mithril/core/protocol";
import { google } from "../src/google/index.ts";
import { openai } from "../src/openai/index.ts";
import { anthropic } from "../src/anthropic/index.ts";

/*
 * The multi-turn tool-history round-trip, per provider.
 *
 * A tool call is only half the contract: step 2's request must carry BOTH the assistant turn that made
 * the call AND the result, paired, in the wire shape that provider actually understands. These tests
 * assert the SECOND request body — the step every provider had untested, and where the model otherwise
 * sees a result with no record of what produced it and starts inventing.
 */

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "t", validate: (v) => ({ value: v as T }) } };
}
const TRANSPORT: Transport = { kind: "byok", apiKey: "k" };

const weather = tool({
  name: "weather",
  description: "current weather",
  inputSchema: schema<{ city: string }>(),
  execute: async ({ city }) => ({ tempC: 21, city }),
});

/** Capture every outgoing request body while replaying a canned pair of streamed responses. */
function capturing(responses: readonly (() => Response)[]): { readonly rt: RuntimeAdapter; readonly bodies: unknown[] } {
  const bodies: unknown[] = [];
  let i = 0;
  const fetchImpl = (async (_url: unknown, init?: { body?: string }) => {
    bodies.push(JSON.parse(init?.body ?? "{}"));
    const make = responses[i++] ?? responses[responses.length - 1];
    return make?.() ?? new Response(null, { status: 500 });
  }) as unknown as typeof fetch;
  return { rt: { ...defaultRuntime(), fetch: fetchImpl }, bodies };
}

function sse(objs: readonly unknown[]): Response {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(c) {
        for (const o of objs) c.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));
        c.close();
      },
    }),
    { status: 200 },
  );
}

test("google: step 2 carries the functionCall and its functionResponse", async () => {
  const { rt, bodies } = capturing([
    () => sse([{ candidates: [{ content: { parts: [{ functionCall: { name: "weather", args: { city: "NYC" } } }] }, finishReason: "STOP" }] }]),
    () => sse([{ candidates: [{ content: { parts: [{ text: "21C" }] }, finishReason: "STOP" }] }]),
  ]);
  const a = agent({ model: google("gemini-2.0-flash"), instructions: "x", tools: [weather] });
  await a.run("weather?", { deps: undefined, runtime: rt, transport: TRANSPORT });

  const second = bodies[1] as { contents: { role: string; parts: Record<string, unknown>[] }[] };
  const modelTurn = second.contents.find((c) => c.parts.some((p) => "functionCall" in p));
  expect(modelTurn?.role).toBe("model");
  expect(modelTurn?.parts[0]?.["functionCall"]).toMatchObject({ name: "weather", args: { city: "NYC" } });

  const resultTurn = second.contents.find((c) => c.parts.some((p) => "functionResponse" in p));
  expect(resultTurn).toBeDefined();
  expect(resultTurn?.parts[0]?.["functionResponse"]).toMatchObject({ name: "weather" });
  // The raw JSON string must never be smuggled in as a plain user text part.
  expect(JSON.stringify(second.contents)).not.toContain('{"text":"{');
});

test("openai: step 2 pairs tool_calls with a tool_call_id-matched result", async () => {
  const { rt, bodies } = capturing([
    () =>
      sse([
        { choices: [{ delta: { tool_calls: [{ index: 0, id: "call_abc", function: { name: "weather", arguments: '{"city":"NYC"}' } }] } }] },
        { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
        "[DONE]" as unknown as object,
      ]),
    () => sse([{ choices: [{ delta: { content: "21C" }, finish_reason: "stop" }] }, "[DONE]" as unknown as object]),
  ]);
  const a = agent({ model: openai("gpt-4o-mini"), instructions: "x", tools: [weather] });
  await a.run("weather?", { deps: undefined, runtime: rt, transport: TRANSPORT });

  const second = bodies[1] as { messages: { role: string; tool_calls?: { id: string }[]; tool_call_id?: string }[] };
  const asst = second.messages.find((m) => m.role === "assistant" && m.tool_calls !== undefined);
  expect(asst?.tool_calls?.[0]?.id).toBe("call_abc");
  const result = second.messages.find((m) => m.role === "tool");
  expect(result?.tool_call_id).toBe("call_abc");
});

test("anthropic: step 2 pairs tool_use with a tool_use_id-matched tool_result", async () => {
  const { rt, bodies } = capturing([
    () =>
      sse([
        { type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "toolu_1", name: "weather" } },
        { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '{"city":"NYC"}' } },
        { type: "content_block_stop", index: 0 },
        { type: "message_delta", delta: { stop_reason: "tool_use" } },
      ]),
    () =>
      sse([
        { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "21C" } },
        { type: "message_delta", delta: { stop_reason: "end_turn" } },
      ]),
  ]);
  const a = agent({ model: anthropic("claude-sonnet-4-5"), instructions: "x", tools: [weather] });
  await a.run("weather?", { deps: undefined, runtime: rt, transport: TRANSPORT });

  const second = bodies[1] as { messages: { role: string; content: unknown }[] };
  const flat = JSON.stringify(second.messages);
  expect(flat).toContain('"tool_use"');
  expect(flat).toContain('"toolu_1"');
  const parts = second.messages.flatMap((m) => (Array.isArray(m.content) ? (m.content as { type: string; tool_use_id?: string }[]) : []));
  const result = parts.find((p) => p.type === "tool_result");
  expect(result?.tool_use_id).toBe("toolu_1");
});

test("openai-compatible servers that omit tool-call ids still get unique callIds", async () => {
  // groq/vLLM/llama.cpp-style servers routinely omit `id`. Two parallel calls sharing "" would collide:
  // the loop keys results by callId, so one result would land on both calls.
  const { rt } = capturing([
    () =>
      sse([
        {
          choices: [
            {
              delta: {
                tool_calls: [
                  { index: 0, function: { name: "weather", arguments: '{"city":"NYC"}' } },
                  { index: 1, function: { name: "weather", arguments: '{"city":"Paris"}' } },
                ],
              },
            },
          ],
        },
        { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
      ]),
    () => sse([{ choices: [{ delta: { content: "ok" }, finish_reason: "stop" }] }]),
  ]);
  const a = agent({ model: openai("gpt-4o-mini"), instructions: "x", tools: [weather] });
  const seen: string[] = [];
  for await (const ev of a.stream("weather?", { deps: undefined, runtime: rt, transport: TRANSPORT })) {
    if (ev.type === "tool.call") seen.push(ev.callId);
  }
  expect(seen).toHaveLength(2);
  expect(new Set(seen).size).toBe(2);
  expect(seen.every((id) => id !== "")).toBe(true);
});
