/**
 * Anthropic Messages API provider adapter for Mithril.
 *
 * @packageDocumentation
 */

import type { AnyTool, ChatRequest, JsonSchemaConverter, ModelHandle, Provider, ProviderSpec, Transport } from "@mithril/core/protocol";
import { toJsonSchema } from "@mithril/core/protocol";
// stream.ts is internal: SSE parsing for the `/messages` endpoint. Request serialization lives inline below.
import { parseAnthropicStream } from "./stream.ts";

const ANTHROPIC_SPEC: ProviderSpec = { id: "anthropic", models: {} };
const DEFAULT_BASE = "https://api.anthropic.com/v1";
const API_VERSION = "2023-06-01";

function toAnthropicBody(req: ChatRequest, convert?: JsonSchemaConverter): string {
  const model = req.model.includes("/") ? req.model.slice(req.model.indexOf("/") + 1) : req.model;
  const pending: string[] = [];
  const messages: unknown[] = [];
  for (const m of req.messages) {
    if (m.role === "assistant" && m.toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: [
          ...(m.content !== "" ? [{ type: "text", text: m.content }] : []),
          ...m.toolCalls.map((tc) => ({ type: "tool_use", id: tc.callId, name: tc.name, input: tc.input })),
        ],
      });
      for (const tc of m.toolCalls) pending.push(tc.callId);
    } else if (m.role === "tool") {
      const id = pending.shift();
      messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: id ?? "", content: m.content }] });
    } else {
      messages.push({ role: m.role, content: m.content });
    }
  }
  const body: Record<string, unknown> = { model, system: req.system, messages, max_tokens: 4096, stream: true };
  const tools = req.tools as readonly AnyTool<unknown>[];
  if (tools.length > 0) {
    body["tools"] = tools.map((t) => ({ name: t.name, description: t.description, input_schema: toJsonSchema(t.inputSchema, convert) }));
  }
  return JSON.stringify(body);
}

function headersFor(transport: Transport, configBase: string | undefined): { readonly base: string; readonly headers: Record<string, string> } {
  const common = { "anthropic-version": API_VERSION };
  switch (transport.kind) {
    case "byok":
      // Anthropic serves CORS only behind this explicit opt-in header — the provider injects it, so a
      // browser BYOK call works without the consumer wiring it.
      return {
        base: transport.baseUrl ?? configBase ?? DEFAULT_BASE,
        headers: { ...common, "x-api-key": transport.apiKey, "anthropic-dangerous-direct-browser-access": "true" },
      };
    case "proxy":
      return { base: transport.baseUrl, headers: common };
    case "ephemeral":
      return { base: transport.baseUrl, headers: { ...common } };
  }
}

/**
 * Creates an Anthropic {@link Provider} whose `chat` method streams `/messages` responses.
 *
 * @param config - Optional overrides. `baseUrl` replaces the default `https://api.anthropic.com/v1` endpoint;
 *   a `Transport`-supplied `baseUrl` still takes precedence. Requests are pinned to API version `2023-06-01`
 *   and sent with `max_tokens: 4096`.
 * @returns A {@link Provider} bound to the Anthropic wire format.
 *
 * @remarks
 * Use this when you need a provider configured for a custom endpoint. For the common case, prefer the
 * {@link anthropic} model-handle factory, which wraps a shared default-configured instance.
 *
 * Tool parameters are converted via {@link toJsonSchema}: precise `input_schema` when the tool's input
 * schema self-describes (see `withJsonSchema`) or a `toolSchema` converter is supplied, permissive
 * `{ type: "object" }` otherwise.
 *
 * With a `byok` transport the provider auto-injects the `anthropic-dangerous-direct-browser-access: true`
 * header, since Anthropic serves CORS only behind that explicit opt-in — so a browser BYOK call works
 * without the consumer wiring the header themselves. The key is exposed to the page; use a `proxy`
 * transport in production.
 */
export function anthropicProvider(config?: { readonly baseUrl?: string; readonly toolSchema?: JsonSchemaConverter }): Provider {
  return {
    spec: ANTHROPIC_SPEC,
    async *chat(req, rt, transport, signal) {
      const { base, headers } = headersFor(transport, config?.baseUrl);
      const auth = transport.kind === "ephemeral" ? { "x-api-key": await transport.token() } : {};
      const res = await rt.fetch(`${base}/messages`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", ...headers, ...auth },
        body: toAnthropicBody(req, config?.toolSchema),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Anthropic HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      if (res.body === null) throw new Error("Anthropic response had no body");
      yield* parseAnthropicStream(res.body);
    },
  };
}

const shared = anthropicProvider();

/**
 * Self-wiring model handle: `agent({ model: anthropic("claude-sonnet-4"), … })` needs no provider registry.
 *
 * @param model - An Anthropic model id (e.g. `"claude-sonnet-4"`). It is prefixed with `anthropic/` to form
 *   the handle id and slashes are stripped before hitting the wire.
 * @returns A {@link ModelHandle} bound to a shared default-configured {@link anthropicProvider}.
 *
 * @example
 * ```ts
 * import { agent } from "@mithril/core";
 * import { anthropic } from "@mithril/providers/anthropic";
 *
 * const a = agent({ model: anthropic("claude-sonnet-4"), tools: [] });
 * ```
 *
 * @remarks Need a custom `baseUrl`? Build a provider with {@link anthropicProvider} instead.
 */
export function anthropic(model: string): ModelHandle {
  return { id: `anthropic/${model}`, provider: shared };
}
