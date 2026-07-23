/*
 * Spec → TypeScript. A deterministic, hand-written emitter: canonical property order (mirroring
 * core's AgentConfig declaration order), 2-space indent, double quotes, trailing commas — the same
 * spec always yields byte-identical code, so code-view diffs are clean and `parseProject` can
 * recognize exactly what this emits (the round-trip invariant: `parse(generate(spec)) ≡ spec`).
 *
 * Verbatim CodeRegions are emitted exactly as stored, never reformatted — that is what makes
 * opaque round-trips lossless.
 */

import type {
  AgentSpec,
  CodeRegion,
  EntryMessage,
  EntrySpec,
  ModelSpec,
  ProjectSpec,
  SubAgentToolSpec,
  ToolSpec,
  WorkflowRoute,
  WorkflowSpec,
} from "./types.ts";

/**
 * `"studio"` emits `await run(entry, input)` — the injected runner global of
 * `@mithril/runner-web`. `"export"` emits a standalone `main()` that calls `agent.run()` directly,
 * for a project a user downloads and runs with Bun/Node.
 */
export type CodegenMode = "studio" | "export";

/** Options for {@link generateProject}. */
export interface GenerateOptions {
  readonly mode?: CodegenMode;
}

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

/** The exact provider-const statement emitted (and re-absorbed) when a groq model is present. */
export const GROQ_PROVIDER_DECL = `const groq = openaiProvider({ baseUrl: ${JSON.stringify(GROQ_BASE_URL)} });`;

/** Emit a string as a canonical double-quoted source literal. Shared with {@link generateEvalRun}. */
export const str = (s: string): string => JSON.stringify(s);

/** The provider-import token a model needs (for import planning), or `undefined` for a verbatim `code` model. */
export function providerOf(model: ModelSpec): "openai" | "anthropic" | "google" | "groq" | "transformers" | undefined {
  if (model.kind === "live") return model.provider;
  if (model.kind === "local") return "transformers";
  return undefined;
}

/** Map a set of provider tokens to their `{ module → named imports }` entries — the provider half of an import plan. */
export function providerImportEntries(providers: ReadonlySet<string>): Map<string, readonly string[]> {
  const out = new Map<string, readonly string[]>();
  if (providers.has("anthropic")) out.set("mithril/anthropic", ["anthropic"]);
  if (providers.has("openai") || providers.has("groq")) {
    out.set("mithril/openai", [...(providers.has("openai") ? ["openai"] : []), ...(providers.has("groq") ? ["openaiProvider"] : [])]);
  }
  if (providers.has("google")) out.set("@mithril/providers/google", ["google"]);
  if (providers.has("transformers")) out.set("mithril/transformers", ["transformers"]);
  return out;
}

/** Emit an agent's `model` expression from its {@link ModelSpec}. Shared with {@link generateEvalRun}. */
export function modelExpr(model: ModelSpec): string {
  switch (model.kind) {
    case "live":
      switch (model.provider) {
        case "openai":
          return `openai(${str(model.model)})`;
        case "anthropic":
          return `anthropic(${str(model.model)})`;
        case "google":
          return `google(${str(model.model)})`;
        case "groq":
          return `{ id: ${str(`groq/${model.model}`)}, provider: groq }`;
      }
      break;
    case "local":
      return model.dtype === undefined
        ? `transformers(${str(model.model)})`
        : `transformers(${str(model.model)}, { dtype: ${str(model.dtype)} })`;
    case "code":
      return model.expr.code;
  }
}

/** Emit a JSON value as canonical single-line source (double quotes, no trailing spaces). */
export function jsonExpr(value: unknown): string {
  return JSON.stringify(value) ?? "null";
}

function region(r: CodeRegion): string {
  return r.code;
}

function toolDecl(t: ToolSpec): string {
  const props: string[] = [
    `name: ${str(t.name)},`,
    `description: ${str(t.description)},`,
    `inputSchema: ${t.inputSchema.zod},`,
  ];
  if (t.outputSchema !== undefined) props.push(`outputSchema: ${t.outputSchema.zod},`);
  if (t.examples !== undefined) props.push(`examples: ${jsonExpr(t.examples)},`);
  if (t.needsApproval !== undefined) {
    props.push(`needsApproval: ${typeof t.needsApproval === "boolean" ? String(t.needsApproval) : region(t.needsApproval)},`);
  }
  props.push(`execute: ${region(t.execute)},`);
  return `const ${t.id} = tool({\n${props.map((p) => `  ${p}`).join("\n")}\n});`;
}

/**
 * The property lines of an `agent({ … })` literal, in canonical order. When `modelExprOverride` is given it
 * replaces the `model:` line — the seam {@link generateEvalRun} uses to build one agent per matrix model from
 * a single spec.
 */
export function agentProps(a: AgentSpec, modelExprOverride?: string): string[] {
  const props: string[] = [
    `model: ${modelExprOverride ?? modelExpr(a.model)},`,
    `instructions: ${typeof a.instructions === "string" ? str(a.instructions) : region(a.instructions)},`,
  ];
  if (a.tools.length > 0) props.push(`tools: [${a.tools.join(", ")}],`);
  if (a.output !== undefined) props.push(`output: ${a.output.zod},`);
  if (a.maxSteps !== undefined) props.push(`maxSteps: ${a.maxSteps},`);
  if (a.outputRetries !== undefined) props.push(`outputRetries: ${a.outputRetries},`);
  if (a.toolRetries !== undefined) props.push(`toolRetries: ${a.toolRetries},`);
  if (a.loopDetection !== undefined) props.push(`loopDetection: ${a.loopDetection},`);
  if (a.maxTokens !== undefined) props.push(`maxTokens: ${a.maxTokens},`);
  if (a.maxCostMicroUsd !== undefined) props.push(`maxCostMicroUsd: ${a.maxCostMicroUsd},`);
  if (a.repair !== undefined) props.push(`repair: ${a.repair},`);
  if (a.selfCorrection !== undefined) props.push(`selfCorrection: ${a.selfCorrection},`);
  if (a.use !== undefined && a.use.length > 0) props.push(`use: [${a.use.map(region).join(", ")}],`);
  return props;
}

function agentDecl(a: AgentSpec): string {
  return `const ${a.id} = agent({\n${agentProps(a).map((p) => `  ${p}`).join("\n")}\n});`;
}

function subAgentDecl(s: SubAgentToolSpec): string {
  const props: string[] = [`name: ${str(s.name)},`, `description: ${str(s.description)},`];
  if (s.input !== undefined) props.push(`inputSchema: ${s.input.zod},`);
  return `const ${s.id} = asTool(${s.agentId}, {\n${props.map((p) => `  ${p}`).join("\n")}\n});`;
}

function routeExpr(route: WorkflowRoute, stateVar: string): string {
  return "goto" in route ? `goto(${str(route.goto)}, ${stateVar})` : `done(${stateVar})`;
}

function workflowDecl(w: WorkflowSpec): string {
  const steps = w.steps.map((step) => {
    if (step.kind === "code") return `  ${step.name}: ${region(step.body)},`;
    if (step.kind === "branch") {
      const lines = [
        ...step.branches.map((b) => `    if ((${region(b.when)})(state)) return ${routeExpr(b.then, "state")};`),
        `    return ${routeExpr(step.otherwise, "state")};`,
      ];
      return `  ${step.name}: async (state) => {\n${lines.join("\n")}\n  },`;
    }
    const lines = [
      `    const result = await ${step.agentId}.run((${region(step.inputExpr)})(state));`,
      `    if (result.status !== "completed") throw new Error(${str(`step ${step.name}: run `)} + result.status);`,
      `    const next = (${region(step.assign)})(state, result.output);`,
      `    return ${routeExpr(step.next, "next")};`,
    ];
    return `  ${step.name}: async (state) => {\n${lines.join("\n")}\n  },`;
  });
  const opts = w.maxSteps === undefined ? `{ start: ${str(w.start)} }` : `{ start: ${str(w.start)}, maxSteps: ${w.maxSteps} }`;
  const prefix = w.stateType === undefined ? "" : `${region(w.stateType)}\n\n`;
  return `${prefix}const ${w.id} = defineWorkflow({\n${steps.join("\n")}\n}, ${opts});`;
}

/** Emit an entry/case input (a string or a message list) as source. Shared with {@link generateEvalRun}. */
export function inputExpr(input: EntrySpec["input"]): string {
  if (typeof input === "string") return str(input);
  const msgs = input.map((m: EntryMessage) => `  { role: ${str(m.role)}, content: ${str(m.content)} },`);
  return `[\n${msgs.join("\n")}\n]`;
}

/** Emit a single top-level declaration's source. Shared with {@link generateEvalRun} to re-emit project decls. */
export function declSource(d: ProjectSpec["decls"][number]): string {
  switch (d.kind) {
    case "tool":
      return toolDecl(d);
    case "agent":
      return agentDecl(d);
    case "subAgentTool":
      return subAgentDecl(d);
    case "workflow":
      return workflowDecl(d);
    case "opaque":
      return d.code;
  }
}

/**
 * The named imports codegen will emit for a spec, keyed by module specifier. Exported for the
 * parser: an existing import may be absorbed (dropped and regenerated) ONLY when its bindings are
 * a subset of this plan — otherwise a consumer in an opaque decl would lose its import.
 */
export function plannedImports(spec: ProjectSpec): ReadonlyMap<string, readonly string[]> {
  const mithrilNames = new Set<string>();
  const providers = new Set<string>();
  let zod = false;
  let workflows = false;
  for (const d of spec.decls) {
    if (d.kind === "tool") {
      mithrilNames.add("tool");
      zod = true;
    }
    if (d.kind === "agent") {
      mithrilNames.add("agent");
      const p = providerOf(d.model);
      if (p !== undefined) providers.add(p);
      if (d.output !== undefined) zod = true;
    }
    if (d.kind === "subAgentTool") {
      mithrilNames.add("asTool");
      if (d.input !== undefined) zod = true;
    }
    if (d.kind === "workflow") workflows = true;
  }
  const out = new Map<string, readonly string[]>();
  if (mithrilNames.size > 0) out.set("mithril", [...mithrilNames].sort());
  for (const [mod, names] of providerImportEntries(providers)) out.set(mod, names);
  if (workflows) out.set("@mithril/workflows", ["defineWorkflow", "done", "goto"]);
  if (zod) out.set("zod", ["z"]);
  return out;
}

const IMPORT_ORDER = ["mithril", "mithril/anthropic", "mithril/openai", "@mithril/providers/google", "mithril/transformers", "@mithril/workflows", "zod"];

function importLines(spec: ProjectSpec): string[] {
  const plan = plannedImports(spec);
  return IMPORT_ORDER.flatMap((mod) => {
    const names = plan.get(mod);
    return names === undefined ? [] : [`import { ${names.join(", ")} } from ${JSON.stringify(mod)};`];
  });
}

/**
 * Generate the complete TypeScript source for a project. Deterministic: the same spec always
 * yields byte-identical output, and {@link https://mithril.dev | parseProject} recognizes exactly
 * this shape (plus arbitrary hand edits, which degrade losslessly to opaque regions).
 */
export function generateProject(spec: ProjectSpec, opts?: GenerateOptions): string {
  const mode: CodegenMode = opts?.mode ?? "studio";
  const blocks: string[] = [...importLines(spec)];
  const needsGroq = spec.decls.some((d) => d.kind === "agent" && d.model.kind === "live" && d.model.provider === "groq");

  const declBlocks: string[] = [];
  if (needsGroq) declBlocks.push(GROQ_PROVIDER_DECL);
  for (const d of spec.decls) {
    switch (d.kind) {
      case "tool":
        declBlocks.push(toolDecl(d));
        break;
      case "agent":
        declBlocks.push(agentDecl(d));
        break;
      case "subAgentTool":
        declBlocks.push(subAgentDecl(d));
        break;
      case "workflow":
        declBlocks.push(workflowDecl(d));
        break;
      case "opaque":
        declBlocks.push(d.code);
        break;
    }
  }

  const entry =
    mode === "studio"
      ? `await run(${spec.entry.target}, ${inputExpr(spec.entry.input)});`
      : [
          `async function main() {`,
          `  const result = await ${spec.entry.target}.run(${inputExpr(spec.entry.input)});`,
          `  if (result.status === "completed") console.log(result.output);`,
          `  else console.error(result);`,
          `}`,
          ``,
          `await main();`,
        ].join("\n");

  const head = blocks.join("\n");
  const body = [...declBlocks, entry].join("\n\n");
  return head.length === 0 ? `${body}\n` : `${head}\n\n${body}\n`;
}
