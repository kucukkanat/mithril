import { expect, test } from "bun:test";
import { liveProvider } from "../src/catalog.ts";
import { fetchProviderModels, resolveBaseUrl, testConnection } from "../src/connection.ts";

/** A fetch double that records every call and replays queued responses in order. */
function stubFetch(responses: readonly Response[]): { readonly fetch: typeof fetch; readonly calls: { url: string; init?: RequestInit }[] } {
  const calls: { url: string; init?: RequestInit }[] = [];
  let i = 0;
  const fn = ((url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), ...(init === undefined ? {} : { init }) });
    const res = responses[Math.min(i++, responses.length - 1)];
    if (res === undefined) throw new Error("no queued response");
    return Promise.resolve(res);
  }) as unknown as typeof fetch;
  return { fetch: fn, calls };
}

const ok = (body: unknown = {}): Response => new Response(JSON.stringify(body), { status: 200 });
const err = (status: number, body = ""): Response => new Response(body, { status });

test("resolveBaseUrl: blank/whitespace overrides fall back to the provider default", () => {
  expect(resolveBaseUrl("openai")).toBe("https://api.openai.com/v1");
  expect(resolveBaseUrl("openai", "   ")).toBe("https://api.openai.com/v1");
  expect(resolveBaseUrl("openai", "https://gw.internal/v1")).toBe("https://gw.internal/v1");
});

test("resolveBaseUrl: trims a trailing slash so paths never double up", () => {
  expect(resolveBaseUrl("openai", "https://gw.internal/v1/")).toBe("https://gw.internal/v1");
});

test("testConnection: a blank key fails as a key fault without any request", () => {
  const { fetch, calls } = stubFetch([ok()]);
  return testConnection({ provider: "openai", model: "gpt-4o-mini", apiKey: "  ", fetch }).then((r) => {
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fault).toBe("key");
    expect(calls).toHaveLength(0);
  });
});

test("testConnection: a blank model fails as a model fault without any request", async () => {
  const { fetch, calls } = stubFetch([ok()]);
  const r = await testConnection({ provider: "openai", model: "", apiKey: "sk-x", fetch });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.fault).toBe("model");
  expect(calls).toHaveLength(0);
});

test("testConnection: OpenAI wire posts a one-token completion to {base}/chat/completions", async () => {
  const { fetch, calls } = stubFetch([ok()]);
  const r = await testConnection({ provider: "openai", model: "gpt-4o-mini", apiKey: "sk-x", fetch });
  expect(r.ok).toBe(true);
  expect(calls[0]?.url).toBe("https://api.openai.com/v1/chat/completions");
  const body = JSON.parse(String(calls[0]?.init?.body)) as { model: string; max_tokens: number };
  expect(body.model).toBe("gpt-4o-mini");
  expect(body.max_tokens).toBe(1);
});

test("testConnection: a base URL override changes where the probe goes", async () => {
  const { fetch, calls } = stubFetch([ok()]);
  const r = await testConnection({ provider: "openai", model: "m", apiKey: "sk-x", baseUrl: "https://gw.internal/v1", fetch });
  expect(calls[0]?.url).toBe("https://gw.internal/v1/chat/completions");
  if (r.ok) expect(r.endpoint).toBe("https://gw.internal/v1");
});

test("testConnection: Anthropic wire posts to {base}/messages with the version + browser headers", async () => {
  const { fetch, calls } = stubFetch([ok()]);
  await testConnection({ provider: "anthropic", model: "claude-haiku-4-5", apiKey: "sk-ant", fetch });
  expect(calls[0]?.url).toBe("https://api.anthropic.com/v1/messages");
  const headers = calls[0]?.init?.headers as Record<string, string>;
  expect(headers["x-api-key"]).toBe("sk-ant");
  expect(headers["anthropic-version"]).toBe("2023-06-01");
});

test("testConnection: an Anthropic base URL override is honoured", async () => {
  const { fetch, calls } = stubFetch([ok()]);
  await testConnection({ provider: "anthropic", model: "m", apiKey: "k", baseUrl: "https://claude-proxy.internal/v1", fetch });
  expect(calls[0]?.url).toBe("https://claude-proxy.internal/v1/messages");
});

test("testConnection: Google wire carries the key as a query param", async () => {
  const { fetch, calls } = stubFetch([ok()]);
  await testConnection({ provider: "google", model: "gemini-2.5-flash", apiKey: "gk", fetch });
  expect(calls[0]?.url).toContain("/models/gemini-2.5-flash:generateContent?key=gk");
});

test("testConnection: 401 is a key fault, 404 a model fault, 5xx a network fault", async () => {
  for (const [status, fault] of [
    [401, "key"],
    [403, "key"],
    [404, "model"],
    [429, "key"],
    [503, "network"],
  ] as const) {
    const { fetch } = stubFetch([err(status, "nope")]);
    const r = await testConnection({ provider: "openai", model: "m", apiKey: "k", fetch });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.fault).toBe(fault);
      expect(r.status).toBe(status);
    }
  }
});

test("testConnection: a 400 naming the model is a model fault", async () => {
  const { fetch } = stubFetch([err(400, `{"error":{"message":"Unknown model: bogus"}}`)]);
  const r = await testConnection({ provider: "openai", model: "bogus", apiKey: "k", fetch });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.fault).toBe("model");
});

test("testConnection: retries once with max_completion_tokens when the server demands it", async () => {
  const { fetch, calls } = stubFetch([err(400, `{"error":{"message":"Unsupported parameter: use 'max_completion_tokens'"}}`), ok()]);
  const r = await testConnection({ provider: "openai", model: "gpt-5", apiKey: "k", fetch });
  expect(r.ok).toBe(true);
  expect(calls).toHaveLength(2);
  expect(JSON.parse(String(calls[0]?.init?.body))).toHaveProperty("max_tokens");
  expect(JSON.parse(String(calls[1]?.init?.body))).toHaveProperty("max_completion_tokens");
});

test("testConnection: a thrown fetch is reported as an unreachable endpoint, not a bad key", async () => {
  const fetch = (() => Promise.reject(new TypeError("Failed to fetch"))) as unknown as typeof fetch;
  const r = await testConnection({ provider: "openai", model: "m", apiKey: "k", baseUrl: "https://nope.invalid/v1", fetch });
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.fault).toBe("baseUrl");
    expect(r.message).toContain("https://nope.invalid/v1");
  }
});

test("fetchProviderModels: parses the OpenAI listing shape", async () => {
  const { fetch, calls } = stubFetch([ok({ data: [{ id: "gpt-4o" }, { id: "gpt-4o-mini" }, { notAnId: 1 }] })]);
  const ids = await fetchProviderModels({ provider: "openai", apiKey: "k", fetch });
  expect(ids).toEqual(["gpt-4o", "gpt-4o-mini"]);
  expect(calls[0]?.url).toBe("https://api.openai.com/v1/models");
});

test("fetchProviderModels: strips Gemini's `models/` prefix", async () => {
  const { fetch } = stubFetch([ok({ models: [{ name: "models/gemini-2.5-flash" }] })]);
  expect(await fetchProviderModels({ provider: "google", apiKey: "k", fetch })).toEqual(["gemini-2.5-flash"]);
});

test("fetchProviderModels: never throws — a failure is simply `undefined`", async () => {
  const { fetch } = stubFetch([err(500)]);
  expect(await fetchProviderModels({ provider: "openai", apiKey: "k", fetch })).toBeUndefined();

  const boom = (() => Promise.reject(new Error("offline"))) as unknown as typeof fetch;
  expect(await fetchProviderModels({ provider: "openai", apiKey: "k", fetch: boom })).toBeUndefined();

  // No key ⇒ no request at all.
  const { fetch: unused, calls } = stubFetch([ok()]);
  expect(await fetchProviderModels({ provider: "openai", apiKey: "", fetch: unused })).toBeUndefined();
  expect(calls).toHaveLength(0);
});

test("catalog: every provider declares the env vars and endpoint the probe relies on", () => {
  for (const id of ["openai", "anthropic", "google", "groq", "deepseek", "openrouter"] as const) {
    const p = liveProvider(id);
    expect(p.envVar).toBe(`${id.toUpperCase()}_API_KEY`);
    expect(p.baseUrlEnvVar).toBe(`${id.toUpperCase()}_BASE_URL`);
    expect(p.defaultBaseUrl.startsWith("https://")).toBe(true);
  }
});
