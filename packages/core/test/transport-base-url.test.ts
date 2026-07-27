import { afterEach, expect, test } from "bun:test";
import { resolveTransport } from "../src/agent/registry.ts";

const ENV = ["OPENAI_API_KEY", "OPENAI_BASE_URL", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"] as const;
const saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of ENV) {
    const v = saved[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

test("resolveTransport: reads <PROVIDER>_API_KEY and <PROVIDER>_BASE_URL from the environment", () => {
  process.env["OPENAI_API_KEY"] = "sk-test";
  process.env["OPENAI_BASE_URL"] = "https://gateway.internal/v1";
  expect(resolveTransport(undefined, "openai/gpt-4o-mini")).toEqual({
    kind: "byok",
    apiKey: "sk-test",
    baseUrl: "https://gateway.internal/v1",
  });
});

test("resolveTransport: omits baseUrl entirely when unset or blank", () => {
  process.env["OPENAI_API_KEY"] = "sk-test";
  delete process.env["OPENAI_BASE_URL"];
  // Omitted, not `undefined` — the provider's `transport.baseUrl ?? config ?? default` chain must
  // fall through to the next source rather than treating the key as present-but-empty.
  expect(resolveTransport(undefined, "openai/gpt-4o-mini")).toEqual({ kind: "byok", apiKey: "sk-test" });

  process.env["OPENAI_BASE_URL"] = "   ";
  expect(resolveTransport(undefined, "openai/gpt-4o-mini")).toEqual({ kind: "byok", apiKey: "sk-test" });
});

test("resolveTransport: an explicit transport still wins over the environment", () => {
  process.env["ANTHROPIC_API_KEY"] = "sk-env";
  process.env["ANTHROPIC_BASE_URL"] = "https://env.example/v1";
  const explicit = { kind: "proxy", baseUrl: "https://explicit.example" } as const;
  expect(resolveTransport(explicit, "anthropic/claude-haiku-4-5")).toBe(explicit);
});

test("resolveTransport: the env var is selected by the model id's provider segment", () => {
  process.env["ANTHROPIC_API_KEY"] = "sk-ant";
  process.env["ANTHROPIC_BASE_URL"] = "https://claude-proxy.internal/v1";
  delete process.env["OPENAI_BASE_URL"];
  expect(resolveTransport(undefined, "anthropic/claude-haiku-4-5")).toEqual({
    kind: "byok",
    apiKey: "sk-ant",
    baseUrl: "https://claude-proxy.internal/v1",
  });
});
