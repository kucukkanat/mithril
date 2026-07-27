/**
 * DeepSeek provider adapter for Mithril.
 *
 * @packageDocumentation
 */

import type { JsonSchemaConverter, ModelHandle, Provider } from "@mithril/core/protocol";
import { compatProvider, type CompatVendor } from "../openai/compat.ts";

// DeepSeek serves the OpenAI wire format at the bare origin — `/v1` is accepted as an alias but is
// not a version marker, so the canonical base is used here.
const DEEPSEEK: CompatVendor = { id: "deepseek", label: "DeepSeek", defaultBaseUrl: "https://api.deepseek.com" };

/**
 * Creates a DeepSeek {@link Provider} whose `chat` method streams `/chat/completions` responses.
 *
 * @param config - Optional overrides. `baseUrl` replaces the default `https://api.deepseek.com` endpoint;
 *   a `Transport`-supplied `baseUrl` still takes precedence. `toolSchema` is a {@link JsonSchemaConverter}
 *   for tool parameters (e.g. `z.toJSONSchema` for Zod v4).
 * @returns A {@link Provider} bound to DeepSeek.
 *
 * @remarks
 * For the common case prefer the {@link deepseek} model-handle factory, which wraps a shared
 * default-configured instance.
 *
 * DeepSeek speaks the OpenAI wire format, so this shares OpenAI's request serializer and SSE parser.
 * `deepseek-reasoner` additionally streams a `reasoning_content` channel, which surfaces as
 * `reasoning.delta` chunks (`reasoning` events on the public stream) ahead of the answer text.
 *
 * With a `byok` transport the call works directly from a browser: DeepSeek reflects the request origin
 * in `access-control-allow-origin` and permits the `authorization` header. The key is exposed to the
 * page — fine for a user's own key or local development; use a `proxy` transport in production.
 */
export function deepseekProvider(config?: { readonly baseUrl?: string; readonly toolSchema?: JsonSchemaConverter }): Provider {
  return compatProvider(DEEPSEEK, config);
}

const shared = deepseekProvider();

/**
 * Self-wiring model handle: `agent({ model: deepseek("deepseek-chat"), … })` needs no provider registry.
 *
 * @param model - A DeepSeek model id — `"deepseek-chat"` or `"deepseek-reasoner"`. It is prefixed with
 *   `deepseek/` to form the handle id, which is also what selects `DEEPSEEK_API_KEY` for BYOK.
 * @param opts - Optional overrides. `toolSchema` is a {@link JsonSchemaConverter} for tool parameters —
 *   supply it when your validator does not self-describe (e.g. Valibot/ArkType without an adapter); Zod v4
 *   schemas already convert with no converter.
 * @returns A {@link ModelHandle} bound to a shared default-configured {@link deepseekProvider} (or a
 *   dedicated one when `toolSchema` is given).
 *
 * @example
 * ```ts
 * import { agent } from "mithril";
 * import { deepseek } from "@mithril/providers/deepseek";
 *
 * // Reads DEEPSEEK_API_KEY from the environment when no transport is passed.
 * const a = agent({ model: deepseek("deepseek-chat"), instructions: "…", tools: [] });
 * ```
 *
 * @remarks Need a custom `baseUrl`? Build a provider with {@link deepseekProvider} instead.
 */
export function deepseek(model: string, opts?: { readonly toolSchema?: JsonSchemaConverter }): ModelHandle {
  const provider = opts?.toolSchema !== undefined ? deepseekProvider({ toolSchema: opts.toolSchema }) : shared;
  return { id: `deepseek/${model}`, provider };
}
