import { expect, test } from "bun:test";
import * as ts from "typescript";
import { generateEvalRun } from "../src/evalgen.ts";
import { SPEC_VERSION, type ModelSpec, type ProjectSpec } from "../src/types.ts";

// Fail on a syntactically invalid emit — the generated script must at least parse as TypeScript.
function assertValidTs(code: string): void {
  const out = ts.transpileModule(code, { reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext } });
  const errors = (out.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error);
  expect(errors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"))).toEqual([]);
}

const WEATHER_TOOL = {
  kind: "tool",
  id: "weather",
  name: "weather",
  description: "Current weather for a city.",
  inputSchema: { zod: `z.object({ city: z.string() })` },
  execute: { code: `async ({ city }) => ({ city, tempC: 21 })` },
} as const;

function specWith(scorers: readonly { readonly type: string; readonly params: Record<string, unknown> }[], reference?: readonly { readonly tool: string; readonly input?: unknown }[]): ProjectSpec {
  return {
    specVersion: SPEC_VERSION,
    name: "demo",
    decls: [
      WEATHER_TOOL,
      { kind: "agent", id: "assistant", model: { kind: "live", provider: "openai", model: "gpt-4o-mini" }, instructions: "You are a concise weather assistant.", tools: ["weather"] },
    ],
    entry: { target: "assistant", input: "What's the weather in Istanbul?" },
    evals: [{ id: "smoke", name: "Smoke", threshold: 1, cases: [{ name: "istanbul", input: "What's the weather in Istanbul?", scorers, ...(reference !== undefined ? { reference } : {}) }] }],
  };
}

const OPENAI: ModelSpec = { kind: "live", provider: "openai", model: "gpt-4o-mini" };
const ANTHROPIC: ModelSpec = { kind: "live", provider: "anthropic", model: "claude-3-5-haiku-latest" };

test("emits imports, a per-model agent factory, cases, and a streaming runSuite", () => {
  const spec = specWith(
    [
      { type: "calledTool", params: { tool: "weather" } },
      { type: "completed", params: {} },
      { type: "outputIncludes", params: { substring: "21", ignoreCase: true } },
      { type: "matchesTrajectory", params: { mode: "superset" } },
    ],
    [{ tool: "weather", input: { city: "Istanbul" } }],
  );
  const code = generateEvalRun(spec, { suiteId: "smoke", models: [OPENAI, ANTHROPIC] });
  assertValidTs(code);

  // imports
  expect(code).toContain(`import { agent, tool } from "mithril";`);
  expect(code).toContain(`import { anthropic } from "mithril/anthropic";`);
  expect(code).toContain(`import { openai } from "mithril/openai";`);
  expect(code).toContain(`import { z } from "zod";`);
  expect(code).toMatch(/import \{ [^}]*runSuite[^}]* \} from "@mithril\/evals";/);
  expect(code).toContain("calledTool");
  expect(code).toContain("matchesTrajectory");

  // per-model agent factory (model swapped in) — the tool decl is reused verbatim
  expect(code).toContain("const buildEvalAgent = (model) => agent({");
  expect(code).toContain("model: model,");
  expect(code).toContain("tools: [weather],");
  expect(code).toContain("const weather = tool({");

  // cases carry the scorer expressions
  expect(code).toContain(`calledTool("weather")`);
  expect(code).toContain(`outputIncludes("21", { ignoreCase: true })`);
  expect(code).toContain(`matchesTrajectory([{"tool":"weather","input":{"city":"Istanbul"}}], { mode: "superset" })`);

  // matrix + streaming
  expect(code).toContain(`{ label: "openai/gpt-4o-mini", agent: buildEvalAgent(openai("gpt-4o-mini")), cases },`);
  expect(code).toContain(`{ label: "anthropic/claude-3-5-haiku-latest", agent: buildEvalAgent(anthropic("claude-3-5-haiku-latest")), cases },`);
  expect(code).toContain("onRun: (run) => emit(run)");
});

test("groq matrix model emits the provider decl and openaiProvider import", () => {
  const spec = specWith([{ type: "completed", params: {} }]);
  const code = generateEvalRun(spec, { suiteId: "smoke", models: [{ kind: "live", provider: "groq", model: "llama-3.3-70b-versatile" }] });
  assertValidTs(code);
  expect(code).toMatch(/import \{[^}]*openaiProvider[^}]*\} from "mithril\/openai";/);
  expect(code).toContain("const groq = openaiProvider({ baseUrl:");
  expect(code).toContain(`{ id: "groq/llama-3.3-70b-versatile", provider: groq }`);
});

test("a judge model on a different provider than the matrix is import-planned", () => {
  const spec = specWith([{ type: "llmJudge", params: { model: { kind: "live", provider: "google", model: "gemini-2.0-flash" }, rubric: "correct?" } }]);
  const code = generateEvalRun(spec, { suiteId: "smoke", models: [OPENAI] });
  assertValidTs(code);
  expect(code).toContain(`import { google } from "@mithril/providers/google";`);
  expect(code).toContain(`llmJudge({ model: google("gemini-2.0-flash"), rubric: "correct?" })`);
});

test("export mode writes an htmlReport and sets the exit code", () => {
  const spec = specWith([{ type: "completed", params: {} }]);
  const code = generateEvalRun(spec, { suiteId: "smoke", models: [OPENAI], mode: "export" });
  assertValidTs(code);
  expect(code).toContain(`import type { EvalReportEntry } from "@mithril/evals";`);
  expect(code).toMatch(/import \{ [^}]*htmlReport[^}]* \} from "@mithril\/evals";/);
  expect(code).toContain("await Bun.write(");
  expect(code).toContain("process.exitCode = result.ok ? 0 : 1;");
  expect(code).not.toContain("emit(");
});

test("deterministic: the same spec + options yields byte-identical output", () => {
  const spec = specWith([{ type: "completed", params: {} }]);
  const a = generateEvalRun(spec, { suiteId: "smoke", models: [OPENAI, ANTHROPIC] });
  const b = generateEvalRun(spec, { suiteId: "smoke", models: [OPENAI, ANTHROPIC] });
  expect(a).toBe(b);
});

test("errors: unknown suite, no models, non-agent target", () => {
  const spec = specWith([{ type: "completed", params: {} }]);
  expect(() => generateEvalRun(spec, { suiteId: "nope", models: [OPENAI] })).toThrow(/not found/);
  expect(() => generateEvalRun(spec, { suiteId: "smoke", models: [] })).toThrow(/at least one model/);
  const badTarget: ProjectSpec = { ...spec, entry: { target: "weather", input: "x" } };
  expect(() => generateEvalRun(badTarget, { suiteId: "smoke", models: [OPENAI] })).toThrow(/must be an agent/);
});
