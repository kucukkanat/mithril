import { expect, test } from "bun:test";
import { defaultRuntime } from "@mithril/core/agent";
import type { ChatRequest, ProviderChunk, RuntimeAdapter, Transport } from "@mithril/core/protocol";
import { deepseek, deepseekProvider } from "../src/deepseek/index.ts";

// Same shape as openai.test.ts: only fetch is injected, so the REAL request serializer and SSE parser
// are under test with zero network.
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

interface Captured {
  url: string;
  init: RequestInit | undefined;
}

function capturingRuntime(captured: Captured, response: () => Response): RuntimeAdapter {
  return {
    ...defaultRuntime(),
    fetch: (async (url: string, init: RequestInit | undefined) => {
      captured.url = url;
      captured.init = init;
      return response();
    }) as unknown as typeof fetch,
  };
}

const TRANSPORT: Transport = { kind: "byok", apiKey: "test-key" };
const signal = new AbortController().signal;
const req = (model: string): ChatRequest => ({ model, system: "", messages: [], tools: [] });

test("posts to DeepSeek's endpoint with the provider prefix stripped from the model", async () => {
  const captured: Captured = { url: "", init: undefined };
  const rt = capturingRuntime(captured, () => sse([{ choices: [{ delta: { content: "hi" }, finish_reason: "stop" }] }]));
  for await (const _ of deepseekProvider().chat(req("deepseek/deepseek-chat"), rt, TRANSPORT, signal)) void _;

  expect(captured.url).toBe("https://api.deepseek.com/chat/completions");
  expect(JSON.parse(String(captured.init?.body)).model).toBe("deepseek-chat");
});

test("streams deepseek-reasoner's reasoning_content as reasoning.delta, ahead of the answer", async () => {
  const captured: Captured = { url: "", init: undefined };
  const rt = capturingRuntime(captured, () =>
    sse([
      { choices: [{ delta: { reasoning_content: "Let me think" } }] },
      { choices: [{ delta: { reasoning_content: " about it." } }] },
      { choices: [{ delta: { content: "42" } }] },
      { choices: [{ delta: {}, finish_reason: "stop" }] },
    ]),
  );
  const chunks: ProviderChunk[] = [];
  for await (const c of deepseekProvider().chat(req("deepseek/deepseek-reasoner"), rt, TRANSPORT, signal)) chunks.push(c);

  expect(chunks.slice(0, 3)).toEqual([
    { type: "reasoning.delta", delta: "Let me think" },
    { type: "reasoning.delta", delta: " about it." },
    { type: "text.delta", delta: "42" },
  ]);
});

test("maps DeepSeek's flat cache-hit and reasoning token counts into UsageDelta", async () => {
  const captured: Captured = { url: "", init: undefined };
  const rt = capturingRuntime(captured, () =>
    sse([
      {
        choices: [{ delta: {}, finish_reason: "stop" }],
        // prompt_tokens already INCLUDES the cache hits — cacheRead is a breakdown of input, not an addition.
        usage: { prompt_tokens: 100, completion_tokens: 20, prompt_cache_hit_tokens: 64, completion_tokens_details: { reasoning_tokens: 12 } },
      },
    ]),
  );
  const chunks: ProviderChunk[] = [];
  for await (const c of deepseekProvider().chat(req("deepseek/deepseek-reasoner"), rt, TRANSPORT, signal)) chunks.push(c);

  expect(chunks.at(-1)).toEqual({
    type: "message.end",
    usage: { input: 100, output: 20, cacheRead: 64, cacheWrite: 0, reasoning: 12, costMicroUsd: 0 },
    finishReason: "stop",
  });
});

test("an empty byok key throws an actionable DEEPSEEK_API_KEY error before any request goes out", async () => {
  let fetched = false;
  const rt: RuntimeAdapter = {
    ...defaultRuntime(),
    fetch: (async () => {
      fetched = true;
      return new Response(null, { status: 200 });
    }) as typeof fetch,
  };
  const gen = deepseekProvider().chat(req("deepseek/deepseek-chat"), rt, { kind: "byok", apiKey: "" }, signal);
  await expect(gen.next()).rejects.toThrow(/DEEPSEEK_API_KEY/);
  expect(fetched).toBe(false);
});

test("the handle prefixes the model id, which is what selects DEEPSEEK_API_KEY for BYOK", () => {
  expect(deepseek("deepseek-chat").id).toBe("deepseek/deepseek-chat");
  expect(deepseek("deepseek-chat").provider.spec.id).toBe("deepseek");
  // A shared instance is reused unless a toolSchema converter forces a dedicated one.
  expect(deepseek("deepseek-chat").provider).toBe(deepseek("deepseek-reasoner").provider);
});

// Regression: DeepSeek's V4 line stamps `"usage": null` on every non-final chunk and nulls the
// channel it is not currently streaming (`content: null` through a reasoning burst, `tool_calls: null`
// on text frames). Presence checks treated those nulls as values — `mapUsage(null)` threw and killed
// the whole run mid-stream, and a null content leaked out as a `text.delta` carrying null.
test("tolerates DeepSeek V4's null usage / content / tool_calls fields", async () => {
  const captured: Captured = { url: "", init: undefined };
  const rt = capturingRuntime(captured, () =>
    sse([
      { choices: [{ delta: { role: "assistant", content: null, reasoning_content: "" } }], usage: null },
      { choices: [{ delta: { content: null, reasoning_content: "Let me" } }], usage: null },
      { choices: [{ delta: { content: "Building it.", tool_calls: null } }], usage: null },
      {
        choices: [{ delta: { content: null, tool_calls: [{ index: 0, id: "call_1", function: { name: "create_tool", arguments: '{"name":"x"}' } }] } }],
        usage: null,
      },
      { choices: [{ delta: {}, finish_reason: "tool_calls" }], usage: { prompt_tokens: 10, completion_tokens: 5 } },
    ]),
  );
  const chunks: ProviderChunk[] = [];
  for await (const c of deepseekProvider().chat(req("deepseek/deepseek-v4-flash"), rt, TRANSPORT, signal)) chunks.push(c);

  expect(chunks.filter((c) => c.type === "text.delta")).toEqual([{ type: "text.delta", delta: "Building it." }]);
  expect(chunks.filter((c) => c.type === "reasoning.delta")).toEqual([{ type: "reasoning.delta", delta: "Let me" }]);
  const call = chunks.find((c) => c.type === "tool.call");
  expect(call).toEqual({ type: "tool.call", callId: "call_1", name: "create_tool", input: { name: "x" } });
  const end = chunks.at(-1);
  expect(end?.type).toBe("message.end");
  expect(end?.type === "message.end" && end.finishReason).toBe("tool_calls");
  expect(end?.type === "message.end" && end.usage.input).toBe(10);
});
