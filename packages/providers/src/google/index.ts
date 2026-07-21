/**
 * Google Gemini (generativelanguage API) provider adapter for Mithril.
 *
 * @packageDocumentation
 */

import type { AnyTool, ChatRequest, FinishReason, JsonSchemaConverter, JsonValue, ModelHandle, Provider, ProviderChunk, ProviderSpec, Transport, UsageDelta } from "@mithril/core/protocol";
import { toJsonSchema } from "@mithril/core/protocol";

// Google Gemini (generativelanguage API) streaming provider. Uses streamGenerateContent (SSE of JSON
// candidate chunks). Text + function calls are mapped to ProviderChunks. Request/stream helpers below are internal.

const GOOGLE_SPEC: ProviderSpec = { id: "google", models: {} };
const DEFAULT_BASE = "https://generativelanguage.googleapis.com/v1beta";

interface GPart {
  readonly text?: string;
  readonly functionCall?: { readonly name: string; readonly args: JsonValue };
}
interface GChunk {
  readonly candidates?: readonly { readonly content?: { readonly parts?: readonly GPart[] }; readonly finishReason?: string }[];
  readonly usageMetadata?: { readonly promptTokenCount?: number; readonly candidatesTokenCount?: number };
}

function mapFinish(r: string | undefined): FinishReason {
  switch (r) {
    case "MAX_TOKENS":
      return "length";
    case "SAFETY":
      return "content_filter";
    default:
      return "stop";
  }
}

function toGoogleBody(req: ChatRequest, convert?: JsonSchemaConverter): string {
  const contents = req.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const body: Record<string, unknown> = { contents, systemInstruction: { parts: [{ text: req.system }] } };
  const tools = req.tools as readonly AnyTool<unknown>[];
  if (tools.length > 0) {
    body["tools"] = [
      { functionDeclarations: tools.map((t) => ({ name: t.name, description: t.description, parameters: toJsonSchema(t.inputSchema, convert) })) },
    ];
  }
  return JSON.stringify(body);
}

async function* parseGoogleStream(body: ReadableStream<Uint8Array>): AsyncGenerator<ProviderChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let usage: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };
  let finishReason: FinishReason = "stop";
  let calls = 0;
  let buf = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += value !== undefined ? decoder.decode(value, { stream: true }) : "";
      let idx = buf.indexOf("\n\n");
      while (idx !== -1) {
        const block = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        idx = buf.indexOf("\n\n");
        const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
        if (dataLine === undefined) continue;
        const chunk = JSON.parse(dataLine.slice(5).trim()) as GChunk;
        const cand = chunk.candidates?.[0];
        for (const part of cand?.content?.parts ?? []) {
          if (part.text !== undefined) yield { type: "text.delta", delta: part.text };
          if (part.functionCall !== undefined) {
            calls++;
            yield { type: "tool.call", callId: `call_${calls}`, name: part.functionCall.name, input: part.functionCall.args };
          }
        }
        if (cand?.finishReason !== undefined) finishReason = mapFinish(cand.finishReason);
        if (chunk.usageMetadata !== undefined) {
          usage = { ...usage, input: chunk.usageMetadata.promptTokenCount ?? 0, output: chunk.usageMetadata.candidatesTokenCount ?? 0 };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  yield { type: "message.end", usage, finishReason };
}

/**
 * Creates a Google Gemini {@link Provider} whose `chat` method streams `:streamGenerateContent` responses.
 *
 * @param config - Optional overrides. `baseUrl` replaces the default
 *   `https://generativelanguage.googleapis.com/v1beta` endpoint; a `Transport`-supplied `baseUrl` still takes
 *   precedence.
 * @returns A {@link Provider} bound to the Gemini wire format.
 *
 * @remarks
 * Use this when you need a provider configured for a custom endpoint. For the common case, prefer the
 * {@link google} model-handle factory, which wraps a shared default-configured instance.
 *
 * The API key is passed as a `?key=` query parameter (Gemini's scheme), read from a `byok` transport's
 * `apiKey` or an `ephemeral` transport's `token()`. Tool parameters are converted via {@link toJsonSchema}:
 * precise when the input schema self-describes (see `withJsonSchema`) or a `toolSchema` converter is
 * supplied, permissive `{ type: "object" }` otherwise. Finish reasons are mapped as `MAX_TOKENS` →
 * `length`, `SAFETY` → `content_filter`, everything else → `stop`.
 */
export function googleProvider(config?: { readonly baseUrl?: string; readonly toolSchema?: JsonSchemaConverter }): Provider {
  return {
    spec: GOOGLE_SPEC,
    async *chat(req, rt, transport, signal) {
      const model = req.model.includes("/") ? req.model.slice(req.model.indexOf("/") + 1) : req.model;
      const base = transport.kind === "byok" ? (transport.baseUrl ?? config?.baseUrl ?? DEFAULT_BASE) : transport.baseUrl;
      const key = transport.kind === "byok" ? transport.apiKey : transport.kind === "ephemeral" ? await transport.token() : "";
      const url = `${base}/models/${model}:streamGenerateContent?alt=sse${key !== "" ? `&key=${key}` : ""}`;
      const res = await rt.fetch(url, { method: "POST", signal, headers: { "content-type": "application/json" }, body: toGoogleBody(req, config?.toolSchema) });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Google HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      if (res.body === null) throw new Error("Google response had no body");
      yield* parseGoogleStream(res.body);
    },
  };
}

const shared = googleProvider();

/**
 * Self-wiring model handle: `agent({ model: google("gemini-1.5-pro"), … })` needs no provider registry.
 *
 * @param model - A Gemini model id (e.g. `"gemini-1.5-pro"`). It is prefixed with `google/` to form the
 *   handle id and slashes are stripped before hitting the wire.
 * @returns A {@link ModelHandle} bound to a shared default-configured {@link googleProvider}.
 *
 * @example
 * ```ts
 * import { agent } from "@mithril/core";
 * import { google } from "@mithril/providers/google";
 *
 * const a = agent({ model: google("gemini-1.5-pro"), tools: [] });
 * ```
 *
 * @remarks Need a custom `baseUrl`? Build a provider with {@link googleProvider} instead.
 */
export function google(model: string): ModelHandle {
  return { id: `google/${model}`, provider: shared };
}
