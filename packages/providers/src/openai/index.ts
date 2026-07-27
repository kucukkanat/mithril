/**
 * OpenAI chat-completions provider adapter for Mithril.
 *
 * @packageDocumentation
 */

import type { JsonSchemaConverter, ModelHandle, Provider } from "@mithril/core/protocol";
// compat.ts / request.ts / stream.ts are internal: the shared OpenAI-wire-format transport, request
// serialization, and SSE parsing for the `/chat/completions` endpoint.
import { compatProvider, type CompatVendor } from "./compat.ts";

const OPENAI: CompatVendor = { id: "openai", label: "OpenAI", defaultBaseUrl: "https://api.openai.com/v1" };

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
  return compatProvider(OPENAI, config);
}

const shared = openaiProvider();

/**
 * Self-wiring model handle: `agent({ model: openai("gpt-4o"), … })` needs no provider registry.
 *
 * @param model - An OpenAI model id (e.g. `"gpt-4o"`). It is prefixed with `openai/` to form the handle id.
 * @param opts - Optional overrides. `toolSchema` is a {@link JsonSchemaConverter} for tool parameters —
 *   supply it when your validator does not self-describe (e.g. Valibot/ArkType without an adapter); Zod v4
 *   schemas already convert with no converter.
 * @returns A {@link ModelHandle} bound to a shared default-configured {@link openaiProvider} (or a
 *   dedicated one when `toolSchema` is given).
 *
 * @example
 * ```ts
 * import { agent } from "mithril";
 * import { openai } from "@mithril/providers/openai";
 *
 * const a = agent({ model: openai("gpt-4o"), instructions: "…", tools: [] });
 * ```
 *
 * @remarks Need a custom `baseUrl`? Build a provider with {@link openaiProvider} instead.
 */
export function openai(model: string, opts?: { readonly toolSchema?: JsonSchemaConverter }): ModelHandle {
  const provider = opts?.toolSchema !== undefined ? openaiProvider({ toolSchema: opts.toolSchema }) : shared;
  return { id: `openai/${model}`, provider };
}
