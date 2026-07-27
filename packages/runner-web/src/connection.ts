/*
 * "Test connection" — one real request that answers the only question a BYOK panel can't answer
 * statically: does this key, at this endpoint, actually serve this model?
 *
 * Why a real inference call rather than a cheap `GET /models`: a listing validates the key and the
 * endpoint but says nothing about the model id, and a wrong model id is the single most common
 * failure once someone points the picker at a compatible gateway. So the probe sends a
 * one-token completion — the smallest request that exercises the exact path a run takes — and maps
 * the transport/HTTP failure back to which of the three fields is wrong.
 *
 * Browser-safe: `fetch` only, no Node builtins, so the Studio and the playground both call it directly.
 */

import { liveProvider, type LiveProviderId } from "./catalog.ts";

/** Which field a failed probe points at, so the UI can mark the right input. */
export type ConnectionFault = "key" | "baseUrl" | "model" | "network" | "unknown";

/** The outcome of a {@link testConnection} probe. */
export type ConnectionResult =
  | {
      readonly ok: true;
      /** Round-trip time in ms — the useful half of a successful probe. */
      readonly latencyMs: number;
      /** The endpoint actually called, so the UI can confirm an override took effect. */
      readonly endpoint: string;
    }
  | {
      readonly ok: false;
      /** Which input to blame; drives the inline error placement. */
      readonly fault: ConnectionFault;
      /** A message written for the person who has to fix it. */
      readonly message: string;
      /** The HTTP status, when the request reached the server. */
      readonly status?: number;
      readonly endpoint: string;
    };

/** What to probe. `baseUrl` and `apiKey` are exactly what a run would use. */
export interface ConnectionProbe {
  readonly provider: LiveProviderId;
  readonly model: string;
  readonly apiKey: string;
  /** Optional endpoint override; falls back to the provider's `defaultBaseUrl`. */
  readonly baseUrl?: string;
  /** Injected for tests; defaults to the global `fetch`. */
  readonly fetch?: typeof fetch;
  /** Abort the probe (the UI wires this to unmount / a second click). */
  readonly signal?: AbortSignal;
}

/** Trim a trailing slash so `{base}/path` never doubles up. */
const normalizeBase = (url: string): string => url.replace(/\/+$/, "");

/**
 * Resolve the endpoint a probe (or a run) will actually call: the override when non-empty, else the
 * provider's default.
 *
 * @example
 * ```ts
 * resolveBaseUrl("openai", "  "); // "https://api.openai.com/v1" — blank override is ignored
 * ```
 */
export function resolveBaseUrl(provider: LiveProviderId, baseUrl?: string): string {
  const override = baseUrl?.trim() ?? "";
  return normalizeBase(override.length > 0 ? override : liveProvider(provider).defaultBaseUrl);
}

/** Map an HTTP status + body to the field most likely at fault. */
function classify(status: number, body: string): { readonly fault: ConnectionFault; readonly message: string } {
  const snippet = body.trim().slice(0, 300);
  if (status === 401 || status === 403) {
    return { fault: "key", message: `The endpoint rejected the key (HTTP ${status}). Check the key, and that it belongs to this endpoint.` };
  }
  if (status === 404) {
    // A 404 is genuinely ambiguous — a wrong model on a right endpoint, or a base URL missing its
    // version segment, look identical. Say both rather than guess one.
    return { fault: "model", message: `HTTP 404 — no such model at this endpoint, or the base URL is missing a path segment (e.g. \`/v1\`). ${snippet}`.trim() };
  }
  if (status === 400 && /model/i.test(snippet)) {
    return { fault: "model", message: `The endpoint rejected the model id: ${snippet}` };
  }
  if (status === 429) return { fault: "key", message: "Rate limited (HTTP 429) — the key and endpoint are reachable, but the account is over quota." };
  if (status >= 500) return { fault: "network", message: `The provider returned HTTP ${status}. ${snippet}`.trim() };
  return { fault: "unknown", message: `HTTP ${status}. ${snippet}`.trim() };
}

/** The smallest valid request in each wire dialect, plus where to send it. */
function probeRequest(
  provider: ReturnType<typeof liveProvider>,
  model: string,
  apiKey: string,
  base: string,
  tokenCapField: TokenCapField,
): { readonly url: string; readonly init: RequestInit } {
  const json = { "content-type": "application/json" };
  switch (provider.wire) {
    case "anthropic":
      return {
        url: `${base}/messages`,
        init: {
          method: "POST",
          headers: { ...json, "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
        },
      };
    case "google":
      // The key rides as a query param for Gemini; `generateContent` (not the streaming variant) is
      // the cheapest call that still validates the model id.
      return {
        url: `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        init: {
          method: "POST",
          headers: json,
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "hi" }] }], generationConfig: { maxOutputTokens: 1 } }),
        },
      };
    case "openai":
      return {
        url: `${base}/chat/completions`,
        init: {
          method: "POST",
          headers: { ...json, authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, [tokenCapField]: 1, messages: [{ role: "user", content: "hi" }] }),
        },
      };
  }
}

/*
 * OpenAI's newer models (o-series, gpt-5) reject `max_tokens` and demand `max_completion_tokens`,
 * while every compatible gateway still takes `max_tokens`. Neither is universal, so the probe sends
 * the widely-supported one and retries once when the server says it wanted the other — otherwise a
 * perfectly good connection would report a false failure purely over a field name.
 */
type TokenCapField = "max_tokens" | "max_completion_tokens";
const TOKEN_CAP_MISMATCH = /max_completion_tokens/i;

/**
 * Send one minimal completion to verify a provider connection end to end — key, endpoint, and model id.
 *
 * @param probe - the exact connection a run would use ({@link ConnectionProbe}).
 * @returns {@link ConnectionResult} — `ok` with a latency, or a fault naming which field to fix.
 *
 * @remarks The request is a real, billable one-token completion (a fraction of a cent). It is sent
 * only on an explicit button press, never automatically. A blank key short-circuits without a
 * request, since that answer needs no network.
 *
 * @example
 * ```ts
 * const r = await testConnection({ provider: "openai", model: "gpt-4o-mini", apiKey: key });
 * if (!r.ok) console.error(r.fault, r.message);
 * ```
 */
export async function testConnection(probe: ConnectionProbe): Promise<ConnectionResult> {
  const provider = liveProvider(probe.provider);
  const base = resolveBaseUrl(probe.provider, probe.baseUrl);
  const model = probe.model.trim();
  const apiKey = probe.apiKey.trim();

  if (apiKey.length === 0) return { ok: false, fault: "key", message: `No ${provider.envVar} set — paste a key to test it.`, endpoint: base };
  if (model.length === 0) return { ok: false, fault: "model", message: "Pick or type a model id first.", endpoint: base };

  const doFetch = probe.fetch ?? fetch;
  const started = Date.now();

  const attempt = async (tokenCapField: TokenCapField): Promise<Response | ConnectionResult> => {
    const { url, init } = probeRequest(provider, model, apiKey, base, tokenCapField);
    try {
      return await doFetch(url, { ...init, ...(probe.signal === undefined ? {} : { signal: probe.signal }) });
    } catch (e) {
      // A browser fetch failure is opaque by design (CORS and DNS look the same), so name the two real causes.
      const detail = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        fault: "baseUrl",
        message: `Could not reach ${base} — the endpoint is unreachable, or it does not send CORS headers for browser requests. (${detail})`,
        endpoint: base,
      };
    }
  };

  let res = await attempt("max_tokens");
  if (!(res instanceof Response)) return res;
  if (res.ok) return { ok: true, latencyMs: Date.now() - started, endpoint: base };

  let body = await res.text().catch(() => "");
  if (res.status === 400 && provider.wire === "openai" && TOKEN_CAP_MISMATCH.test(body)) {
    const retry = await attempt("max_completion_tokens");
    if (!(retry instanceof Response)) return retry;
    if (retry.ok) return { ok: true, latencyMs: Date.now() - started, endpoint: base };
    res = retry;
    body = await retry.text().catch(() => "");
  }

  const { fault, message } = classify(res.status, body);
  return { ok: false, fault, message, status: res.status, endpoint: base };
}

/**
 * Fetch the provider's own current model list, so the picker searches what the account can actually
 * call rather than a list baked in at release time.
 *
 * @param probe - provider + key (+ optional endpoint). `model` is ignored.
 * @returns the live ids, or `undefined` when the provider exposes no listing endpoint or the call fails —
 *   callers fall back to the curated {@link LiveProvider.models}.
 *
 * @remarks Never throws: a failed listing is a non-event (the curated list still works), so it must
 * not surface as an error next to a key field.
 */
export async function fetchProviderModels(probe: Omit<ConnectionProbe, "model">): Promise<readonly string[] | undefined> {
  const provider = liveProvider(probe.provider);
  const base = resolveBaseUrl(probe.provider, probe.baseUrl);
  const apiKey = probe.apiKey.trim();
  if (apiKey.length === 0) return undefined;
  // Anthropic's listing needs the same browser-access opt-in header as its messages endpoint.
  const req: { readonly url: string; readonly headers: Record<string, string> } =
    provider.wire === "anthropic"
      ? { url: `${base}/models?limit=100`, headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" } }
      : provider.wire === "google"
        ? { url: `${base}/models?key=${encodeURIComponent(apiKey)}&pageSize=200`, headers: {} }
        : { url: `${base}/models`, headers: { authorization: `Bearer ${apiKey}` } };

  try {
    const res = await (probe.fetch ?? fetch)(req.url, { headers: req.headers, ...(probe.signal === undefined ? {} : { signal: probe.signal }) });
    if (!res.ok) return undefined;
    const json: unknown = await res.json();
    const ids = extractModelIds(json, provider.wire);
    return ids.length > 0 ? ids : undefined;
  } catch {
    return undefined;
  }
}

/** Pull model ids out of each dialect's listing shape, tolerating anything unexpected. */
function extractModelIds(json: unknown, wire: "openai" | "anthropic" | "google"): readonly string[] {
  if (typeof json !== "object" || json === null) return [];
  const record = json as Record<string, unknown>;
  const rows = wire === "google" ? record["models"] : record["data"];
  if (!Array.isArray(rows)) return [];
  const out: string[] = [];
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const value = (row as Record<string, unknown>)[wire === "google" ? "name" : "id"];
    if (typeof value !== "string") continue;
    // Gemini reports `models/gemini-2.5-flash`; the wire id is the last segment.
    out.push(wire === "google" ? (value.split("/").pop() ?? value) : value);
  }
  return out;
}
