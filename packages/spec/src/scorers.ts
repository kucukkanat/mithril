/*
 * The scorer catalog: one declarative source of truth, shared by codegen (spec → scorer expression, in
 * evalgen.ts) and any authoring UI (which renders a form from each descriptor's `params`). A descriptor
 * knows its parameters, the `@mithril/evals` symbols it imports, and how to `emit` its call expression.
 *
 * Emit helpers (str/jsonExpr/modelExpr) are dependency-INJECTED via ScorerEmitContext rather than imported
 * from codegen.ts, so this module depends only on ./types.ts — the DAG stays codegen → scorers → types.
 */

import type { EvalCaseSpec, ModelSpec } from "./types.ts";

/** The input widget a scorer parameter maps to in an authoring UI. */
export type ScorerParamType = "string" | "number" | "boolean" | "regex" | "stringList" | "model" | "trajectoryMatchMode" | "toolArgsMatchMode";

/** One authorable parameter of a scorer. */
export interface ScorerParamField {
  readonly key: string;
  readonly label: string;
  readonly type: ScorerParamType;
  readonly required?: boolean;
  readonly default?: unknown;
  readonly help?: string;
}

/** The source-emitting helpers injected into a descriptor's {@link ScorerDescriptor.emit}. */
export interface ScorerEmitHelpers {
  readonly str: (s: string) => string;
  readonly jsonExpr: (v: unknown) => string;
  readonly modelExpr: (m: ModelSpec) => string;
}

/** Context passed to {@link ScorerDescriptor.emit}: the emit helpers plus the case's pinned reference (if any). */
export interface ScorerEmitContext {
  readonly helpers: ScorerEmitHelpers;
  readonly reference?: EvalCaseSpec["reference"];
}

/** A catalog entry: everything needed to render a scorer's form AND emit its `@mithril/evals` call. */
export interface ScorerDescriptor {
  /** Matches {@link ScorerSpec.type}. */
  readonly type: string;
  readonly label: string;
  readonly summary: string;
  readonly params: readonly ScorerParamField[];
  /** Named imports this scorer needs from `@mithril/evals`. */
  readonly imports: readonly string[];
  /** `true` when the scorer makes a real model call (gates opt-in in the UI). */
  readonly live?: boolean;
  /** Emit the scorer call source-expression, e.g. `calledTool("weather")`. */
  readonly emit: (params: Readonly<Record<string, unknown>>, ctx: ScorerEmitContext) => string;
}

// ── typed param accessors (params arrive as an untyped record) ──────────────────────────────────────────

const asString = (p: Readonly<Record<string, unknown>>, k: string): string => (typeof p[k] === "string" ? (p[k] as string) : "");
const asNumber = (p: Readonly<Record<string, unknown>>, k: string): number | undefined => (typeof p[k] === "number" ? (p[k] as number) : undefined);
const asBool = (p: Readonly<Record<string, unknown>>, k: string): boolean => p[k] === true;
const asStringList = (p: Readonly<Record<string, unknown>>, k: string): string[] => (Array.isArray(p[k]) ? (p[k] as unknown[]).filter((x): x is string => typeof x === "string") : []);

function emitRegex(p: Readonly<Record<string, unknown>>, h: ScorerEmitHelpers): string {
  // A regex param stores `{ source, flags? }`; emitting `new RegExp(...)` avoids `/…/` literal escaping issues.
  const v = (p["pattern"] ?? {}) as { source?: unknown; flags?: unknown };
  const source = typeof v.source === "string" ? v.source : "";
  const flags = typeof v.flags === "string" && v.flags.length > 0 ? v.flags : undefined;
  return flags === undefined ? `new RegExp(${h.str(source)})` : `new RegExp(${h.str(source)}, ${h.str(flags)})`;
}

/** The built-in scorer catalog — the authorable subset of `@mithril/evals`'s scorers. */
export const SCORER_CATALOG: readonly ScorerDescriptor[] = [
  { type: "calledTool", label: "Called tool", summary: "The run called a specific tool.", imports: ["calledTool"], params: [{ key: "tool", label: "Tool name", type: "string", required: true }], emit: (p, { helpers: h }) => `calledTool(${h.str(asString(p, "tool"))})` },
  { type: "didNotCallTool", label: "Did not call tool", summary: "The run abstained from calling a tool.", imports: ["didNotCallTool"], params: [{ key: "tool", label: "Tool name", type: "string", required: true }], emit: (p, { helpers: h }) => `didNotCallTool(${h.str(asString(p, "tool"))})` },
  { type: "completed", label: "Completed", summary: "The run reached a completed final state.", imports: ["completed"], params: [], emit: () => `completed()` },
  { type: "staysBounded", label: "Stays bounded", summary: "No loop-detection halt or budget guard fired.", imports: ["staysBounded"], params: [], emit: () => `staysBounded()` },
  { type: "noToolErrors", label: "No tool errors", summary: "The run produced no tool errors.", imports: ["noToolErrors"], params: [], emit: () => `noToolErrors()` },
  {
    type: "outputIncludes",
    label: "Output includes",
    summary: "The final text contains a substring.",
    imports: ["outputIncludes"],
    params: [
      { key: "substring", label: "Substring", type: "string", required: true },
      { key: "ignoreCase", label: "Ignore case", type: "boolean" },
    ],
    emit: (p, { helpers: h }) => (asBool(p, "ignoreCase") ? `outputIncludes(${h.str(asString(p, "substring"))}, { ignoreCase: true })` : `outputIncludes(${h.str(asString(p, "substring"))})`),
  },
  { type: "outputMatches", label: "Output matches", summary: "The final text matches a regular expression.", imports: ["outputMatches"], params: [{ key: "pattern", label: "Pattern", type: "regex", required: true }], emit: (p, { helpers: h }) => `outputMatches(${emitRegex(p, h)})` },
  { type: "calledInOrder", label: "Called in order", summary: "Tools were called in a given relative order.", imports: ["calledInOrder"], params: [{ key: "tools", label: "Tool names", type: "stringList", required: true }], emit: (p, { helpers: h }) => `calledInOrder(${h.jsonExpr(asStringList(p, "tools"))})` },
  {
    type: "toolCallCount",
    label: "Tool-call count",
    summary: "The number of tool calls is within a range.",
    imports: ["toolCallCount"],
    params: [
      { key: "min", label: "Min", type: "number" },
      { key: "max", label: "Max", type: "number" },
    ],
    emit: (p) => {
      const min = asNumber(p, "min");
      const max = asNumber(p, "max");
      if (min !== undefined && min === max) return `toolCallCount(${min})`;
      const parts = [...(min !== undefined ? [`min: ${min}`] : []), ...(max !== undefined ? [`max: ${max}`] : [])];
      return `toolCallCount({ ${parts.join(", ")} })`;
    },
  },
  { type: "underCost", label: "Under cost", summary: "Total cost is at or under a ceiling (micro-USD).", imports: ["underCost"], params: [{ key: "maxMicroUsd", label: "Max micro-USD", type: "number", required: true }], emit: (p) => `underCost(${asNumber(p, "maxMicroUsd") ?? 0})` },
  { type: "underSteps", label: "Under steps", summary: "The run used at most N steps.", imports: ["underSteps"], params: [{ key: "maxSteps", label: "Max steps", type: "number", required: true }], emit: (p) => `underSteps(${asNumber(p, "maxSteps") ?? 0})` },
  {
    type: "matchesTrajectory",
    label: "Matches trajectory",
    summary: "The tool-call sequence matches a pinned golden reference.",
    imports: ["matchesTrajectory"],
    params: [
      { key: "mode", label: "Sequence mode", type: "trajectoryMatchMode", default: "superset" },
      { key: "toolArgs", label: "Argument mode", type: "toolArgsMatchMode" },
    ],
    emit: (p, { helpers: h, reference }) => {
      if (reference === undefined) throw new Error('the "matchesTrajectory" scorer requires a pinned reference trajectory on the case (record a run, then "Pin as golden").');
      const mode = asString(p, "mode") || "superset";
      const toolArgs = asString(p, "toolArgs");
      const opts = `{ mode: ${h.str(mode)}${toolArgs.length > 0 ? `, toolArgs: ${h.str(toolArgs)}` : ""} }`;
      return `matchesTrajectory(${h.jsonExpr(reference)}, ${opts})`;
    },
  },
  {
    type: "llmJudge",
    label: "LLM judge",
    summary: "A judge model grades the final text against a rubric (makes a real model call).",
    imports: ["llmJudge"],
    live: true,
    params: [
      { key: "model", label: "Judge model", type: "model", required: true },
      { key: "rubric", label: "Rubric", type: "string", required: true },
      { key: "name", label: "Score name", type: "string" },
    ],
    emit: (p, { helpers: h }) => {
      const model = p["model"] as ModelSpec;
      const name = asString(p, "name");
      return `llmJudge({ model: ${h.modelExpr(model)}, rubric: ${h.str(asString(p, "rubric"))}${name.length > 0 ? `, name: ${h.str(name)}` : ""} })`;
    },
  },
];

/** Look up a {@link ScorerDescriptor} by its `type`; `undefined` for an unknown scorer. */
export function scorerDescriptor(type: string): ScorerDescriptor | undefined {
  return SCORER_CATALOG.find((d) => d.type === type);
}
