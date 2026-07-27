/*
 * The shared machinery behind every OpenAI-wire-format provider: OpenAI itself, DeepSeek,
 * OpenRouter, and any `openaiProvider({ baseUrl })` gateway. Internal — each vendor re-exports a
 * narrow, named factory (`openaiProvider`, `deepseekProvider`, …) rather than exposing this, so the
 * public surface stays one obvious function per provider.
 */

import type { JsonSchemaConverter, Provider, ProviderSpec, Transport } from "@mithril/core/protocol";
import { toOpenAIBody } from "./request.ts";
import { parseOpenAIStream } from "./stream.ts";

/** Everything that distinguishes one OpenAI-compatible vendor from another. */
export interface CompatVendor {
  /**
   * The `provider/` segment of a model id. It also selects the BYOK env var (`<ID>_API_KEY`) that
   * `resolveTransport` reads, so it must match the prefix the vendor's model handles emit.
   */
  readonly id: string;
  /** Human-readable name, used in thrown-error messages. */
  readonly label: string;
  /** Endpoint used when neither the {@link Transport} nor the caller's config supplies one. */
  readonly defaultBaseUrl: string;
}

/** Config every OpenAI-compatible provider factory accepts. */
export interface CompatConfig {
  readonly baseUrl?: string;
  readonly toolSchema?: JsonSchemaConverter;
  /** Extra headers on every request. The transport's own headers win on collision. */
  readonly headers?: Readonly<Record<string, string>>;
}

function headersToRecord(init: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  new Headers(init).forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

async function resolveAuth(
  transport: Transport,
  defaultBase: string,
  configBase: string | undefined,
): Promise<{ readonly base: string; readonly headers: Record<string, string> }> {
  switch (transport.kind) {
    case "byok":
      // All three supported vendors serve CORS, so byok works directly from a browser (the key is
      // exposed — fine for a user's own key / dev, use a proxy transport in production).
      return {
        base: transport.baseUrl ?? configBase ?? defaultBase,
        headers: { authorization: `Bearer ${transport.apiKey}`, ...headersToRecord(transport.headers) },
      };
    case "proxy":
      return { base: transport.baseUrl, headers: headersToRecord(transport.headers) };
    case "ephemeral":
      return { base: transport.baseUrl, headers: { authorization: `Bearer ${await transport.token()}` } };
  }
}

/**
 * Build a {@link Provider} that streams `POST {base}/chat/completions` in the OpenAI wire format.
 *
 * @param vendor - Identity + default endpoint of the service being called.
 * @param config - Caller overrides ({@link CompatConfig}).
 * @returns A provider bound to `vendor`'s endpoint.
 */
export function compatProvider(vendor: CompatVendor, config?: CompatConfig): Provider {
  const spec: ProviderSpec = { id: vendor.id, models: {} };
  const envVar = `${vendor.id.toUpperCase()}_API_KEY`;
  return {
    spec,
    async *chat(req, rt, transport, signal) {
      // A missing key resolves to an empty byok key upstream; catch it here with an actionable message
      // instead of letting the request go out and come back as a bare HTTP 401.
      if (transport.kind === "byok" && transport.apiKey === "") {
        throw new Error(
          `No ${vendor.label} API key found. Set ${envVar} in the environment, or pass transport: { kind: "byok", apiKey } (or a proxy transport).`,
        );
      }
      const auth = await resolveAuth(transport, vendor.defaultBaseUrl, config?.baseUrl);
      const res = await rt.fetch(`${auth.base}/chat/completions`, {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", ...config?.headers, ...auth.headers },
        body: toOpenAIBody(req, config?.toolSchema),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${vendor.label} HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      if (res.body === null) throw new Error(`${vendor.label} response had no body`);
      yield* parseOpenAIStream(res.body);
    },
  };
}
