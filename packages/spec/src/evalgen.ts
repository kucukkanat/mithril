/*
 * Spec → runnable eval script. Given a project, one of its eval suites, and a set of models, emit real
 * TypeScript that builds the entry agent once per model (the matrix axis), maps each stored ScorerSpec to
 * its @mithril/evals scorer call, and runs the suite — streaming each result via the injected `emit()`
 * (studio mode) or writing an htmlReport and setting a CI exit code (export mode). Reuses codegen.ts's
 * emitters so the eval code and the project code stay byte-for-byte consistent.
 */

import type { EvalCaseSpec, EvalSuiteSpec, ModelSpec, ProjectSpec, ScorerSpec } from "./types.ts";
import { type CodegenMode, agentProps, declSource, GROQ_PROVIDER_DECL, inputExpr, jsonExpr, modelExpr, plannedImports, providerImportEntries, providerOf, str } from "./codegen.ts";
import { scorerDescriptor, type ScorerEmitContext } from "./scorers.ts";

/** Options for {@link generateEvalRun}. */
export interface GenerateEvalOptions {
  /** The {@link EvalSuiteSpec.id} to run. */
  readonly suiteId: string;
  /** The matrix axis — each model becomes one suite entry with the entry agent's model swapped in. */
  readonly models: readonly ModelSpec[];
  /** `"studio"` (default) streams results via `emit()`; `"export"` writes an htmlReport + sets `process.exitCode`. */
  readonly mode?: CodegenMode;
}

/** A stable, human-readable label for a model, used as the {@link SuiteEntry} label / report group. */
export function modelLabel(m: ModelSpec): string {
  if (m.kind === "live") return `${m.provider}/${m.model}`;
  if (m.kind === "local") return `local/${m.model}`;
  return "code";
}

function isModelSpec(v: unknown): v is ModelSpec {
  if (typeof v !== "object" || v === null) return false;
  const kind = (v as { kind?: unknown }).kind;
  return kind === "live" || kind === "local" || kind === "code";
}

/** The judge models referenced by `llmJudge` scorers in a suite — their providers must be import-planned too. */
function judgeModelsOf(suite: EvalSuiteSpec): ModelSpec[] {
  const out: ModelSpec[] = [];
  for (const c of suite.cases) {
    for (const sc of c.scorers) {
      if (sc.type !== "llmJudge") continue;
      const m = (sc.params as { model?: unknown }).model;
      if (isModelSpec(m)) out.push(m);
    }
  }
  return out;
}

const EVAL_IMPORT_ORDER = ["mithril", "mithril/anthropic", "mithril/openai", "@mithril/providers/google", "mithril/transformers", "@mithril/workflows", "@mithril/evals", "zod"];

function mergeNames(existing: readonly string[] | undefined, add: readonly string[]): readonly string[] {
  return [...new Set([...(existing ?? []), ...add])].sort();
}

/** Union the project's decl imports with the matrix/judge providers and the `@mithril/evals` scorer symbols. */
function plannedEvalImports(spec: ProjectSpec, suite: EvalSuiteSpec, models: readonly ModelSpec[], mode: CodegenMode): Map<string, readonly string[]> {
  const plan = new Map<string, readonly string[]>(plannedImports(spec));
  const providers = new Set<string>();
  for (const m of [...models, ...judgeModelsOf(suite)]) {
    const p = providerOf(m);
    if (p !== undefined) providers.add(p);
  }
  for (const [mod, names] of providerImportEntries(providers)) plan.set(mod, mergeNames(plan.get(mod), names));

  const evals = new Set<string>(["runSuite"]);
  if (mode === "export") evals.add("htmlReport");
  for (const c of suite.cases) {
    for (const sc of c.scorers) {
      const d = scorerDescriptor(sc.type);
      if (d !== undefined) for (const n of d.imports) evals.add(n);
    }
  }
  plan.set("@mithril/evals", [...evals].sort());
  return plan;
}

function importLines(plan: ReadonlyMap<string, readonly string[]>): string[] {
  return EVAL_IMPORT_ORDER.flatMap((mod) => {
    const names = plan.get(mod);
    return names === undefined || names.length === 0 ? [] : [`import { ${names.join(", ")} } from ${JSON.stringify(mod)};`];
  });
}

function scorerExpr(sc: ScorerSpec, c: EvalCaseSpec): string {
  const d = scorerDescriptor(sc.type);
  if (d === undefined) throw new Error(`unknown scorer type "${sc.type}" in eval case "${c.name}"`);
  const ctx: ScorerEmitContext = { helpers: { str, jsonExpr, modelExpr }, ...(c.reference !== undefined ? { reference: c.reference } : {}) };
  return d.emit(sc.params, ctx);
}

function caseExpr(c: EvalCaseSpec): string {
  const scorers = c.scorers.map((sc) => scorerExpr(sc, c)).join(", ");
  return `  { name: ${str(c.name)}, input: ${inputExpr(c.input)}, scorers: [${scorers}] },`;
}

/**
 * Generate a complete, runnable eval-suite script from a project spec, a suite, and a set of models.
 *
 * @param spec - the project; its {@link EntrySpec.target} must be an agent (single-agent evals for now).
 * @param opts - {@link GenerateEvalOptions}: the `suiteId`, the `models` matrix, and the codegen `mode`.
 * @returns TypeScript source. In `"studio"` mode it calls `runSuite(..., { onRun: (run) => emit(run) })` so a
 *   host collects each {@link SuiteRun} off the runner's data channel; in `"export"` mode it writes
 *   `evals.html` and sets a non-zero `process.exitCode` on failure.
 * @throws when the suite id is unknown, no models are given, or the entry target is not an agent.
 * @example
 * ```ts
 * const code = generateEvalRun(spec, { suiteId: "smoke", models: [{ kind: "live", provider: "openai", model: "gpt-4o-mini" }] });
 * ```
 */
export function generateEvalRun(spec: ProjectSpec, opts: GenerateEvalOptions): string {
  const mode: CodegenMode = opts.mode ?? "studio";
  const suite = (spec.evals ?? []).find((s) => s.id === opts.suiteId);
  if (suite === undefined) throw new Error(`eval suite "${opts.suiteId}" not found in the project`);
  if (opts.models.length === 0) throw new Error("generateEvalRun requires at least one model to run against");
  const entry = spec.decls.find((d) => d.id === spec.entry.target);
  if (entry === undefined || entry.kind !== "agent") throw new Error(`the eval entry target "${spec.entry.target}" must be an agent`);

  const plan = plannedEvalImports(spec, suite, opts.models, mode);
  const head = importLines(plan);
  if (mode === "export") head.push(`import type { EvalReportEntry } from "@mithril/evals";`);

  const needsGroq =
    opts.models.some((m) => m.kind === "live" && m.provider === "groq") ||
    judgeModelsOf(suite).some((m) => m.kind === "live" && m.provider === "groq") ||
    spec.decls.some((d) => d.kind === "agent" && d.id !== entry.id && d.model.kind === "live" && d.model.provider === "groq");

  const declBlocks: string[] = [];
  if (needsGroq) declBlocks.push(GROQ_PROVIDER_DECL);
  // Every decl except the entry agent (which becomes the per-model factory below).
  for (const d of spec.decls) {
    if (d.kind === "agent" && d.id === entry.id) continue;
    declBlocks.push(declSource(d));
  }

  const factory = `const buildEvalAgent = (model) => agent({\n${agentProps(entry, "model").map((p) => `  ${p}`).join("\n")}\n});`;
  const cases = `const cases = [\n${suite.cases.map(caseExpr).join("\n")}\n];`;
  const entries = opts.models.map((m) => `  { label: ${str(modelLabel(m))}, agent: buildEvalAgent(${modelExpr(m)}), cases },`).join("\n");
  const threshold = suite.threshold ?? 1;

  const matrix =
    mode === "studio"
      ? [
          `const result = await runSuite([`,
          entries,
          `], {`,
          `  threshold: ${threshold},`,
          `  minPassRate: 0,`,
          `  onRun: (run) => emit(run),`,
          `});`,
          `emit({ kind: "suite-result", ok: result.ok, passed: result.passed, total: result.total, passRate: result.passRate });`,
        ].join("\n")
      : [
          `const report: EvalReportEntry[] = [];`,
          `const result = await runSuite([`,
          entries,
          `], {`,
          `  threshold: ${threshold},`,
          `  minPassRate: 1,`,
          `  onRun: (run) => { report.push({ run, group: run.group, durationMs: run.durationMs }); },`,
          `});`,
          `await Bun.write("evals.html", htmlReport(report, { title: ${str(`${spec.name} — ${suite.name}`)} }));`,
          `process.exitCode = result.ok ? 0 : 1;`,
        ].join("\n");

  const body = [...declBlocks, factory, cases, matrix].join("\n\n");
  return `${head.join("\n")}\n\n${body}\n`;
}
