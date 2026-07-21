/**
 * OpenAI chat-completions provider adapter for Mithril.
 *
 * @packageDocumentation
 */

import type { JsonSchemaConverter, ModelHandle, Provider, ProviderSpec, Transport } from "@mithril/core/protocol";
// request.ts / stream.ts are internal: request serialization and SSE parsing for the `/chat/completions` endpoint.
import { toOpenAIBody } from "./request.ts";
import { parseOpenAIStream } from "./stream.ts";

const OPENAI_SPEC: ProviderSpec = { id: "openai", models: {} };
const DEFAULT_BASE = "https://api.openai.com/v1";

function headersToRecord(init: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  new Headers(init).forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

async function resolveAuth(
  transport: Transport,
  configBase: string | undefined,
): Promise<{ readonly base: string; readonly headers: Record<string, string> }> {
  switch (transport.kind) {
    case "byok":
      // OpenAI serves CORS unconditionally, so byok works directly from a browser (key is exposed — fine
      // for a user's own key / dev, use a proxy transport in production).
      return {
        base: transport.baseUrl ?? configBase ?? DEFAULT_BASE,
        headers: { authorization: `Bearer ${transport.apiKey}`, ...headersToRecord(transport.headers) },
      };
    case "proxy":
      return { base: transport.baseUrl, headers: headersToRecord(transport.headers) };
    case "ephemeral":
      return { base: transport.baseUrl, headers: { authorization: `Bearer ${await transport.token()}` } };
  }
}

/**
 * Creates an OpenAI {@link Provider} whose `chat` method streams `/chat/completions` responses.
 *
 * @param config - Optional overrides. `baseUrl` replaces the default `https://api.openai.com/v1` endpoint
 *   (e.g. to target an OpenAI-compatible gateway); a `Transport`-supplied `baseUrl` still takes precedence.
 *   `toolSchema` is a {@link JsonSchemaConverter} for tool parameters (e.g. `z.toJSONSchema` for Zod v4).
 * @returns A {@link Provider} bound to the OpenAI wire format.
 *
 * @remarks
 * Use this when you need a provider configured for a custom endpoint. For the common case, prefer the
 * {@link openai} model-handle factory, which wraps a shared default-configured instance.
 *
 * Tool parameters are converted via {@link toJsonSchema}: precise when the input schema self-describes
 * (see `withJsonSchema`) or a `toolSchema` converter is supplied, and a permissive `{ type: "object" }`
 * otherwise.
 *
 * With a `byok` transport the call works directly from a browser: OpenAI serves permissive CORS (`*`)
 * unconditionally, so no extra header is injected. The key is exposed to the page — fine for a user's own
 * key or local development; use a `proxy` transport in production.
 */
export function openaiProvider(config?: { readonly baseUrl?: string; readonly toolSchema?: JsonSchemaConverter }): Provider {
  return {
    spec: OPENAI_SPEC,
    async *chat(req, rt, transport, signal) {
      const auth = await resolveAuth(transport, config?.baseUrl);
      const res = await rt.fetch(`${auth.base}/chat/completions`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", ...auth.headers },
        body: toOpenAIBody(req, config?.toolSchema),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`OpenAI HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      if (res.body === null) throw new Error("OpenAI response had no body");
      yield* parseOpenAIStream(res.body);
    },
  };
}

const shared = openaiProvider();

/**
 * Self-wiring model handle: `agent({ model: openai("gpt-4o"), … })` needs no provider registry.
 *
 * @param model - An OpenAI model id (e.g. `"gpt-4o"`). It is prefixed with `openai/` to form the handle id.
 * @returns A {@link ModelHandle} bound to a shared default-configured {@link openaiProvider}.
 *
 * @example
 * ```ts
 * import { agent } from "@mithril/core";
 * import { openai } from "@mithril/providers/openai";
 *
 * const a = agent({ model: openai("gpt-4o"), tools: [] });
 * ```
 *
 * @remarks Need a custom `baseUrl`? Build a provider with {@link openaiProvider} instead.
 */
export function openai(model: string): ModelHandle {
  return { id: `openai/${model}`, provider: shared };
}
