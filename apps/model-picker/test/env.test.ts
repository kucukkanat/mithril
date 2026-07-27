import { expect, test } from "bun:test";
import { connectionEnv, providersOf, selectionEnv } from "../src/env.ts";

test("connectionEnv: emits the key and the base URL as <PROVIDER>_* vars", () => {
  expect(connectionEnv("openai", { apiKey: "sk-x", baseUrl: "https://gw.internal/v1" })).toEqual({
    OPENAI_API_KEY: "sk-x",
    OPENAI_BASE_URL: "https://gw.internal/v1",
  });
});

test("connectionEnv: omits blank values so they fall through to the defaults", () => {
  // An empty base URL must not be exported as "" — that would override the provider's own endpoint
  // with nothing and break every request.
  expect(connectionEnv("openai", { apiKey: "sk-x", baseUrl: "   " })).toEqual({ OPENAI_API_KEY: "sk-x" });
  expect(connectionEnv("openai", { apiKey: "", baseUrl: "https://gw/v1" })).toEqual({ OPENAI_BASE_URL: "https://gw/v1" });
  expect(connectionEnv("openai", undefined)).toEqual({});
});

test("selectionEnv: exposes only the named providers, and reports which lack a key", () => {
  const connections = {
    openai: { apiKey: "sk-openai" },
    anthropic: { baseUrl: "https://proxy/v1" },
    google: { apiKey: "sk-google" },
  };
  const { env, missing } = selectionEnv(["openai", "anthropic"], connections);
  expect(env).toEqual({ OPENAI_API_KEY: "sk-openai", ANTHROPIC_BASE_URL: "https://proxy/v1" });
  // A provider with an endpoint but no key is still missing a key.
  expect(missing).toEqual(["anthropic"]);
  // The unrelated provider's key never enters the run.
  expect(env["GOOGLE_API_KEY"]).toBeUndefined();
});

test("providersOf: only a live selection needs a key", () => {
  expect(providersOf({ kind: "live", provider: "openai", model: "gpt-4o-mini" })).toEqual(["openai"]);
  expect(providersOf({ kind: "local", model: "onnx/x" })).toEqual([]);
  expect(providersOf({ kind: "scripted" })).toEqual([]);
  expect(providersOf({ kind: "code", expr: "myModel" })).toEqual([]);
});
