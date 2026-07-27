import { expect, test } from "bun:test";
import type { ModelSpec, ProjectSpec } from "@mithril/spec";
import type { ModelSelection } from "@mithril-internal/model-picker";
import { toModelSpec, toSelection } from "../src/components/ModelPicker.tsx";
import { envForModel, envForSpec, keysToConnections, stripKeys } from "../src/state/settingsStore.ts";

const CLOUD: ModelSpec = { kind: "live", provider: "anthropic", model: "claude-sonnet-4-5" };
const LOCAL: ModelSpec = { kind: "local", model: "onnx-community/Qwen3-0.6B-ONNX", dtype: "q4" };
const CODE: ModelSpec = { kind: "code", expr: { code: "myModel" } };

test("toSelection/toModelSpec round-trip every ModelSpec kind losslessly", () => {
  for (const spec of [CLOUD, LOCAL, CODE]) {
    expect(toModelSpec(toSelection(spec), spec)).toEqual(spec);
  }
});

test("toSelection: a local model without a dtype does not gain one", () => {
  const bare: ModelSpec = { kind: "local", model: "org/repo" };
  expect(toSelection(bare)).toEqual({ kind: "local", model: "org/repo" });
  expect(toModelSpec(toSelection(bare), bare)).toEqual(bare);
});

test("toModelSpec: the picker-only `scripted` kind falls back rather than throwing", () => {
  // The Studio never offers `scripted`, but a picker must not be able to take the app down.
  const scripted: ModelSelection = { kind: "scripted" };
  expect(toModelSpec(scripted, CLOUD)).toEqual(CLOUD);
});

test("keysToConnections: migrates the pre-v3 flat key map", () => {
  expect(keysToConnections({ openai: "sk-a", anthropic: "sk-b", bogus: 42 })).toEqual({
    openai: { apiKey: "sk-a" },
    anthropic: { apiKey: "sk-b" },
  });
  expect(keysToConnections(undefined)).toEqual({});
  expect(keysToConnections(null)).toEqual({});
});

test("stripKeys: clears credentials but preserves configured endpoints", () => {
  expect(stripKeys({ openai: { apiKey: "sk-a", baseUrl: "https://gw/v1" }, google: { apiKey: "sk-b" } })).toEqual({
    openai: { apiKey: "", baseUrl: "https://gw/v1" },
    google: { apiKey: "" },
  });
});

test("envForModel: a live draft model contributes its key and base URL", () => {
  const connections = { anthropic: { apiKey: "sk-ant", baseUrl: "https://proxy/v1" } };
  expect(envForModel(CLOUD, connections)).toEqual({
    env: { ANTHROPIC_API_KEY: "sk-ant", ANTHROPIC_BASE_URL: "https://proxy/v1" },
    missing: [],
  });
  // On-device and "off" need nothing.
  expect(envForModel(LOCAL, connections)).toEqual({ env: {}, missing: [] });
  expect(envForModel(null, connections)).toEqual({ env: {}, missing: [] });
});

test("envForModel: an endpoint without a key still reports the key as missing", () => {
  expect(envForModel(CLOUD, { anthropic: { baseUrl: "https://proxy/v1" } })).toEqual({
    env: { ANTHROPIC_BASE_URL: "https://proxy/v1" },
    missing: ["anthropic"],
  });
});

test("envForSpec: collects every live provider the spec's agents name", () => {
  const spec = {
    decls: [
      { kind: "agent", id: "a", model: CLOUD, instructions: "", tools: [] },
      { kind: "agent", id: "b", model: { kind: "live", provider: "openai", model: "gpt-4o-mini" }, instructions: "", tools: [] },
      { kind: "agent", id: "c", model: LOCAL, instructions: "", tools: [] },
    ],
    entry: { target: "a", input: "" },
  } as unknown as ProjectSpec;

  const { env, missing } = envForSpec(spec, { anthropic: { apiKey: "sk-ant" } });
  expect(env).toEqual({ ANTHROPIC_API_KEY: "sk-ant" });
  expect(missing).toEqual(["openai"]);
});
