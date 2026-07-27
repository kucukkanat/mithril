import { expect, test } from "bun:test";
import { LIVE_PROVIDERS, liveProvider } from "../src/catalog.ts";
import { fuzzyPositions, fuzzyScore, isCustomModel, searchModels } from "../src/model-search.ts";

const ids = (models: readonly { readonly model: { readonly id: string } }[]): readonly string[] => models.map((m) => m.model.id);

test("fuzzyScore: matches a subsequence, rejects a non-subsequence", () => {
  expect(fuzzyScore("s45", "claude-sonnet-4-5")).toBeGreaterThan(0);
  expect(fuzzyScore("zzz", "gpt-4o-mini")).toBeUndefined();
  // Order matters — the same letters in the wrong order are not a subsequence.
  expect(fuzzyScore("im", "mini")).toBeUndefined();
});

test("fuzzyScore: an empty query matches everything at zero", () => {
  expect(fuzzyScore("", "anything")).toBe(0);
  expect(fuzzyScore("   ", "anything")).toBe(0);
});

test("fuzzyScore: consecutive and word-start matches outrank scattered ones", () => {
  const prefix = fuzzyScore("gpt", "gpt-4o") ?? 0;
  const scattered = fuzzyScore("gpt", "g-p-x-t") ?? 0;
  expect(prefix).toBeGreaterThan(scattered);
});

test("searchModels: an empty query returns the curated list in catalog order", () => {
  const models = liveProvider("openai").models;
  expect(ids(searchModels(models, ""))).toEqual(models.map((m) => m.id));
});

test("searchModels: abbreviated queries land on the intended model", () => {
  const anthropic = liveProvider("anthropic").models;
  expect(ids(searchModels(anthropic, "haiku"))[0]).toBe("claude-haiku-4-5");
  expect(ids(searchModels(anthropic, "opus"))[0]).toBe("claude-opus-4-5");
  const openai = liveProvider("openai").models;
  expect(ids(searchModels(openai, "4omini"))[0]).toBe("gpt-4o-mini");
});

test("searchModels: an id hit outranks a note-only hit", () => {
  // "reasoning" is a NOTE on o4-mini/o3 — a model whose id contains those letters must not beat them,
  // and a query naming the id must not be beaten by prose.
  const openai = liveProvider("openai").models;
  const byNote = ids(searchModels(openai, "reasoning"));
  expect(byNote).toContain("o4-mini");
  expect(ids(searchModels(openai, "gpt-5-nano"))[0]).toBe("gpt-5-nano");
});

test("searchModels: drops non-matches entirely", () => {
  expect(searchModels(liveProvider("deepseek").models, "gemini")).toEqual([]);
});

test("fuzzyPositions: reports the matched indices, empty when there is no match", () => {
  expect(fuzzyPositions("gpt", "gpt-4o")).toEqual([0, 1, 2]);
  expect(fuzzyPositions("zzz", "gpt-4o")).toEqual([]);
});

test("isCustomModel: true for an id outside the provider's list, false for a known one", () => {
  expect(isCustomModel("openai", "gpt-4o-mini")).toBe(false);
  expect(isCustomModel("openai", "my-finetune-v3")).toBe(true);
  // Blank is not "custom" — there is no id to send yet.
  expect(isCustomModel("openai", "   ")).toBe(false);
});

test("isCustomModel: honours a live list when one is supplied", () => {
  const live = [{ id: "internal-gateway-model" }];
  expect(isCustomModel("openai", "internal-gateway-model", live)).toBe(false);
  // A catalog model the account can't actually call IS custom against the live list.
  expect(isCustomModel("openai", "gpt-4o-mini", live)).toBe(true);
});

test("catalog: every provider ships a non-empty model list containing its own default", () => {
  for (const p of LIVE_PROVIDERS) {
    expect(p.models.length).toBeGreaterThan(0);
    expect(p.models.map((m) => m.id)).toContain(p.defaultModel);
  }
});
