import { expect, test } from "bun:test";
import { jsonExpr, modelExpr, str } from "../src/codegen.ts";
import { SCORER_CATALOG, scorerDescriptor } from "../src/scorers.ts";
import type { EvalCaseSpec } from "../src/types.ts";

const helpers = { str, jsonExpr, modelExpr };

function emit(type: string, params: Record<string, unknown>, reference?: EvalCaseSpec["reference"]): string {
  const d = scorerDescriptor(type);
  if (d === undefined) throw new Error(`no descriptor for ${type}`);
  return d.emit(params, { helpers, ...(reference !== undefined ? { reference } : {}) });
}

test("simple scorers emit their calls", () => {
  expect(emit("calledTool", { tool: "weather" })).toBe(`calledTool("weather")`);
  expect(emit("didNotCallTool", { tool: "delete" })).toBe(`didNotCallTool("delete")`);
  expect(emit("completed", {})).toBe(`completed()`);
  expect(emit("staysBounded", {})).toBe(`staysBounded()`);
  expect(emit("noToolErrors", {})).toBe(`noToolErrors()`);
  expect(emit("underCost", { maxMicroUsd: 50000 })).toBe(`underCost(50000)`);
  expect(emit("underSteps", { maxSteps: 8 })).toBe(`underSteps(8)`);
});

test("outputIncludes toggles the ignoreCase option", () => {
  expect(emit("outputIncludes", { substring: "ok" })).toBe(`outputIncludes("ok")`);
  expect(emit("outputIncludes", { substring: "ok", ignoreCase: true })).toBe(`outputIncludes("ok", { ignoreCase: true })`);
});

test("outputMatches emits a new RegExp with optional flags", () => {
  const source = "a\\d+";
  expect(emit("outputMatches", { pattern: { source } })).toBe(`outputMatches(new RegExp(${JSON.stringify(source)}))`);
  expect(emit("outputMatches", { pattern: { source, flags: "i" } })).toBe(`outputMatches(new RegExp(${JSON.stringify(source)}, "i"))`);
});

test("calledInOrder and toolCallCount", () => {
  expect(emit("calledInOrder", { tools: ["search", "book"] })).toBe(`calledInOrder(["search","book"])`);
  expect(emit("toolCallCount", { min: 2, max: 2 })).toBe(`toolCallCount(2)`); // exact
  expect(emit("toolCallCount", { min: 1 })).toBe(`toolCallCount({ min: 1 })`);
  expect(emit("toolCallCount", { min: 1, max: 3 })).toBe(`toolCallCount({ min: 1, max: 3 })`);
});

test("matchesTrajectory consumes the case reference and throws when it is absent", () => {
  expect(emit("matchesTrajectory", { mode: "strict" }, [{ tool: "weather" }])).toBe(`matchesTrajectory([{"tool":"weather"}], { mode: "strict" })`);
  expect(emit("matchesTrajectory", { mode: "superset", toolArgs: "subset" }, [{ tool: "weather", input: { city: "X" } }])).toBe(
    `matchesTrajectory([{"tool":"weather","input":{"city":"X"}}], { mode: "superset", toolArgs: "subset" })`,
  );
  expect(() => emit("matchesTrajectory", { mode: "strict" })).toThrow(/requires a pinned reference/);
});

test("llmJudge emits the model expression and is flagged live", () => {
  expect(emit("llmJudge", { model: { kind: "live", provider: "openai", model: "gpt-4o-mini" }, rubric: "good?" })).toBe(
    `llmJudge({ model: openai("gpt-4o-mini"), rubric: "good?" })`,
  );
  expect(emit("llmJudge", { model: { kind: "live", provider: "openai", model: "gpt-4o-mini" }, rubric: "good?", name: "correctness" })).toBe(
    `llmJudge({ model: openai("gpt-4o-mini"), rubric: "good?", name: "correctness" })`,
  );
  expect(scorerDescriptor("llmJudge")?.live).toBe(true);
});

test("catalog integrity: unique types, non-empty imports, unknown type is undefined", () => {
  const types = SCORER_CATALOG.map((d) => d.type);
  expect(new Set(types).size).toBe(types.length); // no duplicate types
  for (const d of SCORER_CATALOG) expect(d.imports.length).toBeGreaterThan(0);
  expect(scorerDescriptor("nope")).toBeUndefined();
});
