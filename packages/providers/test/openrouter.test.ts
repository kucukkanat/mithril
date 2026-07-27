import { expect, test } from "bun:test";
import { agent, defaultRuntime } from "@mithril/core/agent";
import type { ChatRequest, ProviderChunk, RuntimeAdapter, Transport } from "@mithril/core/protocol";
import { openrouter, openrouterProvider } from "../src/openrouter/index.ts";

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
const done = () => sse([{ choices: [{ delta: { content: "hi" }, finish_reason: "stop" }] }]);

// The load-bearing detail of this provider: OpenRouter model ids are themselves `vendor/model`, and only
// the `openrouter/` handle prefix may be stripped — otherwise the vendor half is lost and the call 404s.
test("strips only the handle prefix, leaving the vendor-qualified model id intact", async () => {
  const captured: Captured = { url: "", init: undefined };
  const rt = capturingRuntime(captured, done);
  const model = openrouter("anthropic/claude-sonnet-4.5");
  expect(model.id).toBe("openrouter/anthropic/claude-sonnet-4.5");

  for await (const _ of openrouterProvider().chat(req(model.id), rt, TRANSPORT, signal)) void _;

  expect(captured.url).toBe("https://openrouter.ai/api/v1/chat/completions");
  expect(JSON.parse(String(captured.init?.body)).model).toBe("anthropic/claude-sonnet-4.5");
});

test("sends attribution as HTTP-Referer / X-Title only when supplied", async () => {
  const withAttr: Captured = { url: "", init: undefined };
  await (async () => {
    const rt = capturingRuntime(withAttr, done);
    const provider = openrouterProvider({ appUrl: "https://example.com", appName: "Example" });
    for await (const _ of provider.chat(req("openrouter/openai/gpt-4o-mini"), rt, TRANSPORT, signal)) void _;
  })();
  const headers = new Headers(withAttr.init?.headers);
  expect(headers.get("http-referer")).toBe("https://example.com");
  expect(headers.get("x-title")).toBe("Example");
  expect(headers.get("authorization")).toBe("Bearer test-key");

  const bare: Captured = { url: "", init: undefined };
  const rt = capturingRuntime(bare, done);
  for await (const _ of openrouterProvider().chat(req("openrouter/openai/gpt-4o-mini"), rt, TRANSPORT, signal)) void _;
  const bareHeaders = new Headers(bare.init?.headers);
  expect(bareHeaders.has("http-referer")).toBe(false);
  expect(bareHeaders.has("x-title")).toBe(false);
});

test("streams OpenRouter's `reasoning` channel as reasoning.delta and reports cost in micro-USD", async () => {
  const captured: Captured = { url: "", init: undefined };
  const rt = capturingRuntime(captured, () =>
    sse([
      { choices: [{ delta: { reasoning: "Weighing options…" } }] },
      { choices: [{ delta: { content: "Done" } }] },
      {
        choices: [{ delta: {}, finish_reason: "stop" }],
        usage: { prompt_tokens: 10, completion_tokens: 4, prompt_tokens_details: { cached_tokens: 8 }, cost: 0.00123 },
      },
    ]),
  );
  const chunks: ProviderChunk[] = [];
  for await (const c of openrouterProvider().chat(req("openrouter/openai/gpt-4o-mini"), rt, TRANSPORT, signal)) chunks.push(c);

  expect(chunks[0]).toEqual({ type: "reasoning.delta", delta: "Weighing options…" });
  expect(chunks.at(-1)).toEqual({
    type: "message.end",
    usage: { input: 10, output: 4, cacheRead: 8, cacheWrite: 0, reasoning: 0, costMicroUsd: 1230 },
    finishReason: "stop",
  });
});

test("drives the full agent loop end to end through the handle", async () => {
  const captured: Captured = { url: "", init: undefined };
  const rt = capturingRuntime(captured, () => sse([{ choices: [{ delta: { content: "It is sunny" } }] }, { choices: [{ delta: {}, finish_reason: "stop" }] }]));
  const a = agent({ model: openrouter("openai/gpt-4o-mini"), instructions: "be helpful", tools: [] });
  const res = await a.run("weather?", { deps: undefined, runtime: rt, transport: TRANSPORT });

  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("It is sunny");
});

test("an empty byok key throws an actionable OPENROUTER_API_KEY error before any request goes out", async () => {
  let fetched = false;
  const rt: RuntimeAdapter = {
    ...defaultRuntime(),
    fetch: (async () => {
      fetched = true;
      return new Response(null, { status: 200 });
    }) as typeof fetch,
  };
  const gen = openrouterProvider().chat(req("openrouter/openai/gpt-4o-mini"), rt, { kind: "byok", apiKey: "" }, signal);
  await expect(gen.next()).rejects.toThrow(/OPENROUTER_API_KEY/);
  expect(fetched).toBe(false);
});
