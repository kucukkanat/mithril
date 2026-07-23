/*
 * TypeScript → spec. A single-pass recognizer over the top-level statements of a source file:
 * framework-shaped declarations (`const x = tool({…})`, `const y = agent({…})`, the
 * `await run(y, …)` entry) are lifted into structured spec decls; EVERYTHING else — including any
 * statement with one unrecognized property — degrades to a verbatim {@link OpaqueDecl}. Code is
 * never dropped or rewritten: the safe default is preserve, not interpret.
 *
 * The compiler is INJECTED (`typeof TS`) rather than imported: `typescript` is a heavy dependency
 * the host loads lazily (e.g. `await import("typescript")` in a worker), and this package's root
 * entry must stay zero-dependency.
 *
 * M1 scope: tools, agents, entry. `asTool` / `defineWorkflow` statements round-trip as opaque
 * decls until the M3 recognizer lands.
 */

import type * as TS from "typescript";
import { GROQ_PROVIDER_DECL, plannedImports } from "./codegen.ts";
import type {
  AgentSpec,
  EntryMessage,
  EntrySpec,
  ModelSpec,
  OpaqueDecl,
  ProjectDecl,
  ProjectSpec,
  ToolSpec,
} from "./types.ts";
import { SPEC_VERSION } from "./types.ts";

/** One parser message, with source offsets a code editor can mark. */
export interface ParseDiagnostic {
  readonly severity: "error" | "warning";
  readonly message: string;
  readonly start: number;
  readonly length: number;
}

/** The outcome of {@link parseProject}. */
export interface ParseResult {
  /** The recognized spec, or `undefined` when the source has syntax errors or no entry. */
  readonly spec: ProjectSpec | undefined;
  readonly diagnostics: readonly ParseDiagnostic[];
  /** How many statements were kept verbatim — surfaced in the UI as "N statements kept as code". */
  readonly opaqueCount: number;
}

const LIVE_CALLEES: Readonly<Record<string, "openai" | "anthropic" | "google">> = {
  openai: "openai",
  anthropic: "anthropic",
  google: "google",
};

interface Ctx {
  readonly ts: typeof TS;
  readonly sf: TS.SourceFile;
}

const text = (ctx: Ctx, node: TS.Node): string => node.getText(ctx.sf);

function stringLit(ctx: Ctx, node: TS.Node): string | undefined {
  return ctx.ts.isStringLiteral(node) ? node.text : undefined;
}

function boolLit(ctx: Ctx, node: TS.Node): boolean | undefined {
  if (node.kind === ctx.ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ctx.ts.SyntaxKind.FalseKeyword) return false;
  return undefined;
}

function numLit(ctx: Ctx, node: TS.Node): number | undefined {
  return ctx.ts.isNumericLiteral(node) ? Number(node.text) : undefined;
}

/** Walk a pure-literal expression into a JSON value; `undefined` marks "not a literal". */
function jsonValue(ctx: Ctx, node: TS.Node): { readonly ok: boolean; readonly value?: unknown } {
  const { ts } = ctx;
  if (ts.isStringLiteral(node)) return { ok: true, value: node.text };
  if (ts.isNumericLiteral(node)) return { ok: true, value: Number(node.text) };
  if (node.kind === ts.SyntaxKind.TrueKeyword) return { ok: true, value: true };
  if (node.kind === ts.SyntaxKind.FalseKeyword) return { ok: true, value: false };
  if (node.kind === ts.SyntaxKind.NullKeyword) return { ok: true, value: null };
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) {
    return { ok: true, value: -Number(node.operand.text) };
  }
  if (ts.isArrayLiteralExpression(node)) {
    const out: unknown[] = [];
    for (const el of node.elements) {
      const v = jsonValue(ctx, el);
      if (!v.ok) return { ok: false };
      out.push(v.value);
    }
    return { ok: true, value: out };
  }
  if (ts.isObjectLiteralExpression(node)) {
    const out: Record<string, unknown> = {};
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) return { ok: false };
      const key = ts.isIdentifier(prop.name) ? prop.name.text : ts.isStringLiteral(prop.name) ? prop.name.text : undefined;
      if (key === undefined) return { ok: false };
      const v = jsonValue(ctx, prop.initializer);
      if (!v.ok) return { ok: false };
      out[key] = v.value;
    }
    return { ok: true, value: out };
  }
  return { ok: false };
}

/**
 * The `{ key: expr }` pairs of an object literal, or `undefined` if any member isn't a plain
 * assignment. Shorthand (`{ model }`) counts: its value is the identifier itself.
 */
function plainProps(ctx: Ctx, obj: TS.ObjectLiteralExpression): Map<string, TS.Expression> | undefined {
  const out = new Map<string, TS.Expression>();
  for (const prop of obj.properties) {
    if (ctx.ts.isShorthandPropertyAssignment(prop)) {
      out.set(prop.name.text, prop.name);
      continue;
    }
    if (!ctx.ts.isPropertyAssignment(prop) || !ctx.ts.isIdentifier(prop.name)) return undefined;
    out.set(prop.name.text, prop.initializer);
  }
  return out;
}

function parseModel(ctx: Ctx, node: TS.Expression): ModelSpec {
  const { ts } = ctx;
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    const callee = node.expression.text;
    const arg0 = node.arguments[0];
    const live = LIVE_CALLEES[callee];
    if (live !== undefined && node.arguments.length === 1 && arg0 !== undefined) {
      const model = stringLit(ctx, arg0);
      if (model !== undefined) return { kind: "live", provider: live, model };
    }
    if (callee === "transformers" && arg0 !== undefined) {
      const model = stringLit(ctx, arg0);
      if (model !== undefined && node.arguments.length === 1) return { kind: "local", model };
      const arg1 = node.arguments[1];
      if (model !== undefined && node.arguments.length === 2 && arg1 !== undefined && ts.isObjectLiteralExpression(arg1)) {
        const props = plainProps(ctx, arg1);
        const dtypeExpr = props?.get("dtype");
        if (props !== undefined && props.size === 1 && dtypeExpr !== undefined) {
          const dtype = stringLit(ctx, dtypeExpr);
          if (dtype !== undefined) return { kind: "local", model, dtype };
        }
      }
    }
  }
  // `{ id: "groq/<model>", provider: groq }` — the openai-compat shape codegen emits for Groq.
  if (ts.isObjectLiteralExpression(node)) {
    const props = plainProps(ctx, node);
    const idExpr = props?.get("id");
    const providerExpr = props?.get("provider");
    if (props !== undefined && props.size === 2 && idExpr !== undefined && providerExpr !== undefined) {
      const id = stringLit(ctx, idExpr);
      if (id !== undefined && id.startsWith("groq/") && ts.isIdentifier(providerExpr) && providerExpr.text === "groq") {
        return { kind: "live", provider: "groq", model: id.slice("groq/".length) };
      }
    }
  }
  return { kind: "code", expr: { code: text(ctx, node) } };
}

function parseTool(ctx: Ctx, id: string, obj: TS.ObjectLiteralExpression): ToolSpec | undefined {
  const props = plainProps(ctx, obj);
  if (props === undefined) return undefined;
  let name: string | undefined;
  let description: string | undefined;
  let spec: Partial<{
    inputSchema: string;
    outputSchema: string;
    examples: readonly unknown[];
    needsApproval: boolean | { code: string };
    execute: string;
  }> = {};
  for (const [key, value] of props) {
    switch (key) {
      case "name":
        name = stringLit(ctx, value);
        if (name === undefined) return undefined;
        break;
      case "description":
        description = stringLit(ctx, value);
        if (description === undefined) return undefined;
        break;
      case "inputSchema":
        spec = { ...spec, inputSchema: text(ctx, value) };
        break;
      case "outputSchema":
        spec = { ...spec, outputSchema: text(ctx, value) };
        break;
      case "examples": {
        const v = jsonValue(ctx, value);
        if (!v.ok || !Array.isArray(v.value)) return undefined;
        spec = { ...spec, examples: v.value };
        break;
      }
      case "needsApproval": {
        const b = boolLit(ctx, value);
        spec = { ...spec, needsApproval: b ?? { code: text(ctx, value) } };
        break;
      }
      case "execute":
        spec = { ...spec, execute: text(ctx, value) };
        break;
      default:
        return undefined; // unrecognized property → whole statement stays opaque
    }
  }
  if (name === undefined || description === undefined || spec.inputSchema === undefined || spec.execute === undefined) {
    return undefined;
  }
  return {
    kind: "tool",
    id,
    name,
    description,
    inputSchema: { zod: spec.inputSchema },
    ...(spec.outputSchema === undefined ? {} : { outputSchema: { zod: spec.outputSchema } }),
    ...(spec.examples === undefined ? {} : { examples: spec.examples }),
    ...(spec.needsApproval === undefined ? {} : { needsApproval: spec.needsApproval }),
    execute: { code: spec.execute },
  };
}

const AGENT_NUMERIC = ["maxSteps", "outputRetries", "toolRetries", "maxTokens", "maxCostMicroUsd"] as const;
const AGENT_BOOLEAN = ["loopDetection", "repair", "selfCorrection"] as const;

function parseAgent(ctx: Ctx, id: string, obj: TS.ObjectLiteralExpression): AgentSpec | undefined {
  const { ts } = ctx;
  const props = plainProps(ctx, obj);
  if (props === undefined) return undefined;
  const modelExpr = props.get("model");
  if (modelExpr === undefined) return undefined;
  const numeric: Record<string, number> = {};
  const boolean: Record<string, boolean> = {};
  let instructions: string | { code: string } | undefined;
  let tools: readonly string[] = [];
  let output: string | undefined;
  let use: readonly { code: string }[] | undefined;
  for (const [key, value] of props) {
    if (key === "model") continue;
    if (key === "instructions") {
      const s = stringLit(ctx, value);
      instructions = s ?? { code: text(ctx, value) };
      continue;
    }
    if (key === "tools") {
      if (!ts.isArrayLiteralExpression(value)) return undefined;
      const ids: string[] = [];
      for (const el of value.elements) {
        if (!ts.isIdentifier(el)) return undefined;
        ids.push(el.text);
      }
      tools = ids;
      continue;
    }
    if (key === "output") {
      output = text(ctx, value);
      continue;
    }
    if (key === "use") {
      if (!ts.isArrayLiteralExpression(value)) return undefined;
      use = value.elements.map((el) => ({ code: text(ctx, el) }));
      continue;
    }
    if ((AGENT_NUMERIC as readonly string[]).includes(key)) {
      const n = numLit(ctx, value);
      if (n === undefined) return undefined;
      numeric[key] = n;
      continue;
    }
    if ((AGENT_BOOLEAN as readonly string[]).includes(key)) {
      const b = boolLit(ctx, value);
      if (b === undefined) return undefined;
      boolean[key] = b;
      continue;
    }
    return undefined; // unrecognized property → whole statement stays opaque
  }
  if (instructions === undefined) return undefined;
  return {
    kind: "agent",
    id,
    model: parseModel(ctx, modelExpr),
    instructions,
    tools,
    ...(output === undefined ? {} : { output: { zod: output } }),
    ...(numeric["maxSteps"] === undefined ? {} : { maxSteps: numeric["maxSteps"] }),
    ...(numeric["outputRetries"] === undefined ? {} : { outputRetries: numeric["outputRetries"] }),
    ...(numeric["toolRetries"] === undefined ? {} : { toolRetries: numeric["toolRetries"] }),
    ...(boolean["loopDetection"] === undefined ? {} : { loopDetection: boolean["loopDetection"] }),
    ...(numeric["maxTokens"] === undefined ? {} : { maxTokens: numeric["maxTokens"] }),
    ...(numeric["maxCostMicroUsd"] === undefined ? {} : { maxCostMicroUsd: numeric["maxCostMicroUsd"] }),
    ...(boolean["repair"] === undefined ? {} : { repair: boolean["repair"] }),
    ...(boolean["selfCorrection"] === undefined ? {} : { selfCorrection: boolean["selfCorrection"] }),
    ...(use === undefined ? {} : { use }),
  };
}

function parseEntryInput(ctx: Ctx, node: TS.Expression): EntrySpec["input"] | undefined {
  const { ts } = ctx;
  const s = stringLit(ctx, node);
  if (s !== undefined) return s;
  if (!ts.isArrayLiteralExpression(node)) return undefined;
  const messages: EntryMessage[] = [];
  for (const el of node.elements) {
    if (!ts.isObjectLiteralExpression(el)) return undefined;
    const props = plainProps(ctx, el);
    const roleExpr = props?.get("role");
    const contentExpr = props?.get("content");
    if (props === undefined || props.size !== 2 || roleExpr === undefined || contentExpr === undefined) return undefined;
    const role = stringLit(ctx, roleExpr);
    const content = stringLit(ctx, contentExpr);
    if ((role !== "user" && role !== "assistant") || content === undefined) return undefined;
    messages.push({ role, content });
  }
  return messages;
}

/** `await run(<identifier>, <input>)` — the studio-mode entry statement. */
function parseEntry(ctx: Ctx, stmt: TS.ExpressionStatement): EntrySpec | undefined {
  const { ts } = ctx;
  const expr = stmt.expression;
  if (!ts.isAwaitExpression(expr) || !ts.isCallExpression(expr.expression)) return undefined;
  const call = expr.expression;
  if (!ts.isIdentifier(call.expression) || call.expression.text !== "run" || call.arguments.length !== 2) return undefined;
  const target = call.arguments[0];
  const inputNode = call.arguments[1];
  if (target === undefined || inputNode === undefined || !ts.isIdentifier(target)) return undefined;
  const input = parseEntryInput(ctx, inputNode);
  if (input === undefined) return undefined;
  return { target: target.text, input };
}

/** The `{ module, names }` of a plain named-import statement, or `undefined` for any other form. */
function namedImport(
  ctx: Ctx,
  stmt: TS.ImportDeclaration,
): { readonly module: string; readonly names: readonly string[] } | undefined {
  const { ts } = ctx;
  const module = stringLit(ctx, stmt.moduleSpecifier);
  if (module === undefined) return undefined;
  const clause = stmt.importClause;
  if (clause === undefined || clause.name !== undefined) return undefined; // default imports aren't regenerated
  const bindings = clause.namedBindings;
  if (bindings === undefined || !ts.isNamedImports(bindings)) return undefined;
  if (!bindings.elements.every((el) => el.propertyName === undefined)) return undefined;
  return { module, names: bindings.elements.map((el) => el.name.text) };
}

/**
 * Parse a whole source file into a {@link ProjectSpec}. `prev` carries what code cannot express —
 * the project `name` and canvas `meta` — forward across reparses.
 *
 * The round-trip invariant: for any spec `s`, `parseProject(generateProject(s), ts, s).spec`
 * deep-equals `s` (M1: for tool/agent/entry/opaque decls).
 */
export function parseProject(source: string, ts: typeof TS, prev?: ProjectSpec): ParseResult {
  const sf = ts.createSourceFile("project.ts", source, ts.ScriptTarget.ES2022, true);
  const ctx: Ctx = { ts, sf };
  const diagnostics: ParseDiagnostic[] = [];

  // Surface syntax errors first — a spec derived from a broken tree could drop code.
  const parseDiags = (sf as unknown as { parseDiagnostics?: readonly TS.DiagnosticWithLocation[] }).parseDiagnostics ?? [];
  for (const d of parseDiags) {
    diagnostics.push({
      severity: "error",
      message: ts.flattenDiagnosticMessageText(d.messageText, "\n"),
      start: d.start,
      length: d.length,
    });
  }
  if (diagnostics.some((d) => d.severity === "error")) {
    return { spec: undefined, diagnostics, opaqueCount: 0 };
  }

  // Two-phase: collect items first, then decide import absorption against codegen's actual plan —
  // an import may be dropped ONLY if codegen will regenerate every one of its bindings, otherwise
  // a consumer inside an opaque decl would lose it. Opaque ids are assigned at the end, in order.
  type Item =
    | { readonly kind: "decl"; readonly decl: Exclude<ProjectDecl, OpaqueDecl> }
    | { readonly kind: "opaque"; readonly code: string }
    | { readonly kind: "import"; readonly code: string; readonly module: string; readonly names: readonly string[] };
  const items: Item[] = [];
  let entry: EntrySpec | undefined;

  const opaque = (stmt: TS.Statement): Item => ({ kind: "opaque", code: stmt.getFullText(sf).trim() });
  const decls: Item[] = items; // alias so the walk below reads naturally

  for (const stmt of sf.statements) {
    if (ts.isImportDeclaration(stmt)) {
      const named = namedImport(ctx, stmt);
      if (named === undefined) decls.push(opaque(stmt));
      else decls.push({ kind: "import", code: stmt.getFullText(sf).trim(), module: named.module, names: named.names });
      continue;
    }
    if (ts.isVariableStatement(stmt)) {
      const declList = stmt.declarationList.declarations;
      const first = declList[0];
      if (
        declList.length === 1 &&
        first !== undefined &&
        ts.isIdentifier(first.name) &&
        first.initializer !== undefined &&
        ts.isCallExpression(first.initializer) &&
        ts.isIdentifier(first.initializer.expression)
      ) {
        const id = first.name.text;
        const callee = first.initializer.expression.text;
        const arg0 = first.initializer.arguments[0];
        if (callee === "tool" && first.initializer.arguments.length === 1 && arg0 !== undefined && ts.isObjectLiteralExpression(arg0)) {
          const parsed = parseTool(ctx, id, arg0);
          decls.push(parsed === undefined ? opaque(stmt) : { kind: "decl", decl: parsed });
          continue;
        }
        if (callee === "agent" && first.initializer.arguments.length === 1 && arg0 !== undefined && ts.isObjectLiteralExpression(arg0)) {
          const parsed = parseAgent(ctx, id, arg0);
          decls.push(parsed === undefined ? opaque(stmt) : { kind: "decl", decl: parsed });
          continue;
        }
        // The exact groq provider const codegen emits — absorbed (regenerated when a groq model exists).
        if (callee === "openaiProvider" && stmt.getText(sf).trim() === GROQ_PROVIDER_DECL) continue;
      }
      decls.push(opaque(stmt));
      continue;
    }
    if (ts.isExpressionStatement(stmt)) {
      const parsed = parseEntry(ctx, stmt);
      if (parsed !== undefined) {
        if (entry !== undefined) {
          diagnostics.push({
            severity: "warning",
            message: "Multiple run(…) entries — the last one is used.",
            start: stmt.getStart(sf),
            length: stmt.getWidth(sf),
          });
        }
        entry = parsed;
        continue;
      }
      decls.push(opaque(stmt));
      continue;
    }
    decls.push(opaque(stmt));
  }

  // Resolve import absorption against what codegen will actually regenerate for these decls.
  const structured = items.flatMap((i) => (i.kind === "decl" ? [i.decl] : []));
  const plan = plannedImports({ specVersion: SPEC_VERSION, name: "", decls: structured, entry: { target: "", input: "" } });
  const finalDecls: ProjectDecl[] = [];
  let opaqueSeq = 0;
  const pushOpaque = (code: string): void => {
    opaqueSeq++;
    finalDecls.push({ kind: "opaque", id: `o${opaqueSeq}`, code });
  };
  for (const item of items) {
    if (item.kind === "decl") {
      finalDecls.push(item.decl);
    } else if (item.kind === "opaque") {
      pushOpaque(item.code);
    } else {
      const planned = plan.get(item.module) ?? [];
      if (!item.names.every((n) => planned.includes(n))) pushOpaque(item.code);
    }
  }
  const opaqueCount = finalDecls.filter((d) => d.kind === "opaque").length;

  if (entry === undefined) {
    diagnostics.push({
      severity: "error",
      message: "No entry found — add `await run(<agent>, <input>)` at the top level.",
      start: source.length,
      length: 0,
    });
    return { spec: undefined, diagnostics, opaqueCount };
  }

  const spec: ProjectSpec = {
    specVersion: SPEC_VERSION,
    name: prev?.name ?? "untitled",
    decls: finalDecls,
    entry,
    ...(prev?.meta === undefined ? {} : { meta: prev.meta }),
  };
  return { spec, diagnostics, opaqueCount };
}
