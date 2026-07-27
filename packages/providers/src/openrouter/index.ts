/**
 * OpenRouter provider adapter for Mithril — one key and one endpoint in front of many model vendors.
 *
 * @packageDocumentation
 */

import type { JsonSchemaConverter, ModelHandle, Provider } from "@mithril/core/protocol";
import { compatProvider, type CompatVendor } from "../openai/compat.ts";

const OPENROUTER: CompatVendor = { id: "openrouter", label: "OpenRouter", defaultBaseUrl: "https://openrouter.ai/api/v1" };

/** Optional attribution shown on OpenRouter's public leaderboards; both fields are sent as headers. */
export interface OpenRouterAttribution {
  /** Your app's URL. Sent as `HTTP-Referer`. */
  readonly appUrl?: string;
  /** Your app's display name. Sent as `X-Title`. */
  readonly appName?: string;
}

function attributionHeaders(a: OpenRouterAttribution | undefined): Record<string, string> {
  return {
    ...(a?.appUrl !== undefined ? { "http-referer": a.appUrl } : {}),
    ...(a?.appName !== undefined ? { "x-title": a.appName } : {}),
  };
}

/**
 * Creates an OpenRouter {@link Provider} whose `chat` method streams `/chat/completions` responses.
 *
 * @param config - Optional overrides. `baseUrl` replaces the default `https://openrouter.ai/api/v1`
 *   endpoint; a `Transport`-supplied `baseUrl` still takes precedence. `toolSchema` is a
 *   {@link JsonSchemaConverter} for tool parameters (e.g. `z.toJSONSchema` for Zod v4). `appUrl` /
 *   `appName` are optional {@link OpenRouterAttribution}.
 * @returns A {@link Provider} bound to OpenRouter.
 *
 * @remarks
 * For the common case prefer the {@link openrouter} model-handle factory, which wraps a shared
 * default-configured instance.
 *
 * OpenRouter speaks the OpenAI wire format, so this shares OpenAI's request serializer and SSE parser.
 * Models that expose a reasoning channel stream it as `reasoning`, which surfaces as `reasoning.delta`
 * chunks ahead of the answer text; when OpenRouter reports a generation `cost`, it lands in the run's
 * `usage.costMicroUsd`.
 *
 * With a `byok` transport the call works directly from a browser: OpenRouter serves permissive CORS
 * (`*`). The key is exposed to the page — fine for a user's own key or local development; use a
 * `proxy` transport in production.
 */
export function openrouterProvider(
  config?: { readonly baseUrl?: string; readonly toolSchema?: JsonSchemaConverter } & OpenRouterAttribution,
): Provider {
  return compatProvider(OPENROUTER, { ...config, headers: attributionHeaders(config) });
}

const shared = openrouterProvider();

/**
 * Self-wiring model handle: `agent({ model: openrouter("anthropic/claude-sonnet-4.5"), … })` needs no
 * provider registry.
 *
 * @param model - An OpenRouter model id, itself `vendor/model` (e.g. `"anthropic/claude-sonnet-4.5"`,
 *   `"deepseek/deepseek-chat"`, `"meta-llama/llama-3.3-70b-instruct"`). It is prefixed with `openrouter/`
 *   to form the handle id, which is also what selects `OPENROUTER_API_KEY` for BYOK; only that first
 *   segment is stripped on the wire, so the vendor-qualified id reaches OpenRouter intact.
 * @param opts - Optional overrides. `toolSchema` is a {@link JsonSchemaConverter} for tool parameters —
 *   supply it when your validator does not self-describe (e.g. Valibot/ArkType without an adapter); Zod v4
 *   schemas already convert with no converter. `appUrl` / `appName` are optional
 *   {@link OpenRouterAttribution}.
 * @returns A {@link ModelHandle} bound to a shared default-configured {@link openrouterProvider} (or a
 *   dedicated one when any option is given).
 *
 * @example
 * ```ts
 * import { agent } from "mithril";
 * import { openrouter } from "@mithril/providers/openrouter";
 *
 * // Reads OPENROUTER_API_KEY from the environment when no transport is passed.
 * const a = agent({ model: openrouter("anthropic/claude-sonnet-4.5"), instructions: "…", tools: [] });
 * ```
 *
 * @remarks Need a custom `baseUrl`? Build a provider with {@link openrouterProvider} instead.
 */
export function openrouter(
  model: string,
  opts?: { readonly toolSchema?: JsonSchemaConverter } & OpenRouterAttribution,
): ModelHandle {
  const provider = opts === undefined ? shared : openrouterProvider(opts);
  return { id: `openrouter/${model}`, provider };
}
