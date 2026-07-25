import { expect, test } from "bun:test";
import { agent, defaultRuntime } from "@mithril/core/agent";
import type { ChatRequest, ModelMessage, ProviderChunk, RuntimeAdapter, Transport } from "@mithril/core/protocol";
import { normalizeContent } from "@mithril/core/protocol";
import { openai, openaiProvider } from "../src/openai/index.ts";
import { anthropicProvider } from "../src/anthropic/index.ts";
import { googleProvider } from "../src/google/index.ts";

const TRANSPORT: Transport = { kind: "byok", apiKey: "k" };
const signal = new AbortController().signal;

// A runtime whose fetch records the POST body and returns a trivial (empty) SSE stream so `chat` completes.
function capturingRuntime(): { rt: RuntimeAdapter; bodies: string[] } {
  const bodies: string[] = [];
  const rt: RuntimeAdapter = {
    ...defaultRuntime(),
    fetch: (async (_url: string, init?: { body?: string }) => {
      bodies.push(init?.body ?? "");
      return new Response(new ReadableStream<Uint8Array>({ start: (c) => c.close() }), { status: 200 });
    }) as unknown as typeof fetch,
  };
  return { rt, bodies };
}

async function drain(gen: AsyncGenerator<ProviderChunk>): Promise<void> {
  for await (const _ of gen) {
    /* consume */
  }
}

// A user message carrying text + an image (data URL) + a PDF file (data URL) — already normalized.
const MULTIMODAL_USER: ModelMessage = {
  role: "user",
  content: [
    { type: "text", text: "what is this?" },
    { type: "image", image: "data:image/png;base64,AAAA", mediaType: "image/png" },
    { type: "file", data: "data:application/pdf;base64,JVBERi0x", mediaType: "application/pdf", filename: "doc.pdf" },
  ],
  toolCalls: [],
};
const req = (messages: readonly ModelMessage[]): ChatRequest => ({ model: "x/y", system: "", messages, tools: [] });

test("normalizeContent turns raw bytes into a JSON-safe data: URL", () => {
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const [part] = normalizeContent([{ type: "image", image: bytes, mediaType: "image/png" }]) as readonly { type: string; image: string }[];
  expect(typeof part?.image).toBe("string");
  expect(part?.image.startsWith("data:image/png;base64,")).toBe(true);
  // Round-trips through JSON (a resumable token requirement).
  expect(() => JSON.stringify(part)).not.toThrow();
});

test("OpenAI serializes multimodal content as text + image_url + file parts", async () => {
  const { rt, bodies } = capturingRuntime();
  await drain(openaiProvider().chat(req([MULTIMODAL_USER]), rt, TRANSPORT, signal));
  const body = JSON.parse(bodies[0] ?? "{}") as { messages: { role: string; content: unknown }[] };
  const user = body.messages.find((m) => m.role === "user");
  expect(user?.content).toEqual([
    { type: "text", text: "what is this?" },
    { type: "image_url", image_url: { url: "data:image/png;base64,AAAA" } },
    { type: "file", file: { filename: "doc.pdf", file_data: "data:application/pdf;base64,JVBERi0x" } },
  ]);
});

test("Anthropic serializes multimodal content as base64 image + document blocks", async () => {
  const { rt, bodies } = capturingRuntime();
  await drain(anthropicProvider().chat(req([MULTIMODAL_USER]), rt, TRANSPORT, signal));
  const body = JSON.parse(bodies[0] ?? "{}") as { messages: { role: string; content: unknown }[] };
  const user = body.messages.find((m) => m.role === "user");
  expect(user?.content).toEqual([
    { type: "text", text: "what is this?" },
    { type: "image", source: { type: "base64", media_type: "image/png", data: "AAAA" } },
    { type: "document", source: { type: "base64", media_type: "application/pdf", data: "JVBERi0x" } },
  ]);
});

test("Google serializes multimodal content as inlineData parts", async () => {
  const { rt, bodies } = capturingRuntime();
  await drain(googleProvider().chat(req([MULTIMODAL_USER]), rt, TRANSPORT, signal));
  const body = JSON.parse(bodies[0] ?? "{}") as { contents: { role: string; parts: unknown[] }[] };
  const user = body.contents.find((c) => c.role === "user");
  expect(user?.parts).toEqual([
    { text: "what is this?" },
    { inlineData: { mimeType: "image/png", data: "AAAA" } },
    { inlineData: { mimeType: "application/pdf", data: "JVBERi0x" } },
  ]);
});

test("end-to-end: a run's Uint8Array image reaches the provider body as a data: URL", async () => {
  const { rt, bodies } = capturingRuntime();
  const png = new Uint8Array([137, 80, 78, 71]); // PNG magic bytes
  const a = agent({ model: openai("gpt-4o"), instructions: "look", tools: [] });
  await a.run([{ role: "user", content: [{ type: "text", text: "describe" }, { type: "image", image: png, mediaType: "image/png" }] }], {
    transport: TRANSPORT,
    runtime: rt,
  });
  const body = JSON.parse(bodies[0] ?? "{}") as { messages: { role: string; content: unknown }[] };
  const user = body.messages.find((m) => m.role === "user");
  const parts = user?.content as { type: string; image_url?: { url: string } }[];
  const image = parts.find((p) => p.type === "image_url");
  expect(image?.image_url?.url.startsWith("data:image/png;base64,")).toBe(true);
});
