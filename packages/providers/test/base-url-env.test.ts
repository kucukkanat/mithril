import { afterEach, expect, test } from "bun:test";
import { defaultRuntime, resolveTransport } from "@mithril/core/agent";
import type { ChatRequest, RuntimeAdapter } from "@mithril/core/protocol";
import { anthropicProvider } from "../src/anthropic/index.ts";
import { openaiProvider } from "../src/openai/index.ts";

/*
 * The endpoint override, end to end: `<PROVIDER>_BASE_URL` in the environment must change the URL a
 * REAL provider request goes to. This is what makes the Studio's / playground's optional base URL
 * field work — both inject it as env, exactly as a Node/Bun user would export it — so it is tested
 * against the actual adapters rather than against the UI's own idea of the URL.
 */

const ENV = ["OPENAI_API_KEY", "OPENAI_BASE_URL", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"] as const;
const saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of ENV) {
    const v = saved[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

/** Capture the URL of the first request, then end the stream cleanly. */
function capturing(urls: string[]): RuntimeAdapter {
  return {
    ...defaultRuntime(),
    fetch: (async (url: string | URL | Request) => {
      urls.push(String(url));
      const body = new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          c.close();
        },
      });
      return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
    }) as typeof fetch,
  };
}

const drain = async (stream: AsyncIterable<unknown>): Promise<void> => {
  for await (const _ of stream) {
    /* consume */
  }
};
const signal = new AbortController().signal;

test("OPENAI_BASE_URL redirects a real OpenAI request to the compatible endpoint", async () => {
  process.env["OPENAI_API_KEY"] = "sk-test";
  process.env["OPENAI_BASE_URL"] = "https://gateway.internal/v1";
  const urls: string[] = [];
  const req: ChatRequest = { model: "openai/gpt-4o-mini", system: "", messages: [], tools: [] };
  const transport = resolveTransport(undefined, req.model);
  await drain(openaiProvider().chat(req, capturing(urls), transport, signal));
  expect(urls[0]).toBe("https://gateway.internal/v1/chat/completions");
});

test("without OPENAI_BASE_URL the request goes to OpenAI's own endpoint", async () => {
  process.env["OPENAI_API_KEY"] = "sk-test";
  delete process.env["OPENAI_BASE_URL"];
  const urls: string[] = [];
  const req: ChatRequest = { model: "openai/gpt-4o-mini", system: "", messages: [], tools: [] };
  await drain(openaiProvider().chat(req, capturing(urls), resolveTransport(undefined, req.model), signal));
  expect(urls[0]).toBe("https://api.openai.com/v1/chat/completions");
});

test("the env override beats a baseUrl baked into the provider config", async () => {
  // Transport is the more specific source, so a user's gateway wins over the code's default — this is
  // what lets the playground's openai-compat examples (which pin a baseUrl) still honour an override.
  process.env["OPENAI_API_KEY"] = "sk-test";
  process.env["OPENAI_BASE_URL"] = "https://user-gateway.internal/v1";
  const urls: string[] = [];
  const req: ChatRequest = { model: "openai/gpt-4o-mini", system: "", messages: [], tools: [] };
  const provider = openaiProvider({ baseUrl: "https://config.example/v1" });
  await drain(provider.chat(req, capturing(urls), resolveTransport(undefined, req.model), signal));
  expect(urls[0]).toBe("https://user-gateway.internal/v1/chat/completions");
});

test("ANTHROPIC_BASE_URL redirects a real Anthropic request", async () => {
  process.env["ANTHROPIC_API_KEY"] = "sk-ant";
  process.env["ANTHROPIC_BASE_URL"] = "https://claude-proxy.internal/v1";
  const urls: string[] = [];
  const req: ChatRequest = { model: "anthropic/claude-haiku-4-5", system: "", messages: [], tools: [] };
  await drain(anthropicProvider().chat(req, capturing(urls), resolveTransport(undefined, req.model), signal));
  expect(urls[0]).toBe("https://claude-proxy.internal/v1/messages");
});
