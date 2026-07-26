/*
 * Drafting help — the model writes the spec text you would otherwise type.
 *
 * A draft IS a Mithril run. Rather than adding a second, parallel path to a model, a draft is a tiny
 * generated Mithril program with a structured `output` schema, executed in the same sandboxed worker
 * as everything else. That means it inherits the on-device model, the BYOK key handling, the worker
 * isolation and the event stream for free, and adds no dependency.
 *
 * Everything here is pure: building the program, phrasing the request that the preview gate shows,
 * and turning a draft back into spec shapes. Executing it is the store's job.
 */
import {
  GROQ_PROVIDER_DECL,
  SPEC_VERSION,
  modelExpr,
  providerImportEntries,
  providerOf,
  type AgentSpec,
  type ModelSpec,
  type ProjectSpec,
  type ToolSpec,
} from "@mithril/spec";
import { liveProvider } from "@mithril/runner-web";
import type { JsonValue } from "@mithril/core/protocol";
import { stubBody } from "./tool-fields.ts";

/** The on-device model drafting defaults to — small, already downloaded for the default templates. */
export const DRAFT_LOCAL_MODEL = "onnx-community/Qwen3-0.6B-ONNX";

/**
 * The model drafting runs on until the user picks another.
 *
 * On-device, so the feature costs nothing and sends nothing on a first run. The picker on the
 * first-run screen writes over this the moment someone chooses a provider.
 */
export const DRAFT_DEFAULT_MODEL: ModelSpec = { kind: "local", model: DRAFT_LOCAL_MODEL };

/** Draft a whole project from the first-run form. */
export interface SpecRequest {
  readonly kind: "spec";
  /** The job line: what the agent is for. */
  readonly job: string;
  /** The examples it must handle; they become the casebook, and steer the draft. */
  readonly cases: readonly string[];
}

/** Rewrite one tool description a model keeps ignoring. */
export interface DescriptionRequest {
  readonly kind: "description";
  readonly toolName: string;
  readonly current: string;
  /** The owning agent's job line, so the rewrite knows the context. */
  readonly job: string;
  /**
   * The tool's input names, in schema order.
   *
   * Carried because the rewrite must be able to state the tool's ARITY. Without it, the drafting model
   * could not say "takes no arguments" even when that was the exact sentence a stalled model needed.
   */
  readonly inputNames: readonly string[];
}

export type DraftRequest = SpecRequest | DescriptionRequest;

/** What came back. `null` fields mean the model declined to draft that part. */
export interface SpecDraft {
  readonly name: string;
  readonly instructions: string;
  readonly tool: {
    readonly name: string;
    readonly description: string;
    readonly inputs: readonly { readonly name: string; readonly type: "text" | "number" | "boolean"; readonly description: string }[];
  } | null;
}

export interface DescriptionDraft {
  readonly description: string;
}

const clip = (s: string, max: number): string => (s.length <= max ? s : `${s.slice(0, max - 1)}…`);

/**
 * The exact instruction text that will be sent.
 *
 * This is what the preview gate renders, so it must be the real string the run uses — a preview that
 * paraphrased the request would defeat the point of the gate.
 */
export function promptFor(req: DraftRequest): string {
  if (req.kind === "description") {
    return [
      `A tool named \`${req.toolName}\` is not being called by the model when it should be.`,
      `Its current description is: "${req.current}"`,
      `The agent's job is: "${req.job}"`,
      "",
      // Asking for the TRIGGER is what produced "When preparing for meetings, call the calendar reader" —
      // a description a real model read as a precondition it had not met, and so declined to call. Ask for
      // what the tool RETURNS instead, and for its arity, which is the other thing that stalls a call.
      "Rewrite the description to say what the tool RETURNS, in the present tense, unconditionally.",
      "Do not phrase it as a condition (no \"when …\", no \"if …\") — a model reads that as a precondition to check.",
      req.inputNames.length === 0
        ? "State explicitly that it takes no arguments."
        : `State what it needs: ${req.inputNames.map((n) => `\`${n}\``).join(", ")}.`,
      "One or two sentences. No preamble.",
    ].join("\n");
  }
  const examples = req.cases.filter((c) => c.trim().length > 0);
  return [
    `Design an AI agent whose job is: "${req.job}"`,
    ...(examples.length > 0
      ? ["", "It must handle these examples:", ...examples.map((c, i) => `${i + 1}. ${clip(c.trim(), 200)}`)]
      : []),
    "",
    "Return:",
    "- name: a short project name, 2-4 words.",
    "- instructions: the agent's system prompt. Direct, specific, second person. No preamble.",
    "- tool: if the job needs live data or an external action, one tool the agent should have —",
    "  its name (snake_case), a description that says WHEN to call it, and its inputs.",
    "  If the job needs no tool, set tool to null.",
  ].join("\n");
}

// Schemas are written as zod SOURCE because that is what generated code needs — same convention as
// SchemaSpec throughout the spec package.
const SPEC_OUTPUT_ZOD = `z.object({
  name: z.string(),
  instructions: z.string(),
  tool: z.object({
    name: z.string(),
    description: z.string(),
    inputs: z.array(z.object({
      name: z.string(),
      type: z.enum(["text", "number", "boolean"]),
      description: z.string(),
    })),
  }).nullable(),
})`;

const DESCRIPTION_OUTPUT_ZOD = `z.object({ description: z.string() })`;

/**
 * The runnable program for one draft request, on whichever model the user picked.
 *
 * Provider imports come from the spec package's own codegen rather than a second hand-written table,
 * so a drafting run and a generated project always reach a provider the same way.
 *
 * @example
 * ```ts
 * client.run(draftProgram({ kind: "description", ... }, DRAFT_DEFAULT_MODEL), { env });
 * ```
 */
export function draftProgram(req: DraftRequest, model: ModelSpec): string {
  const output = req.kind === "spec" ? SPEC_OUTPUT_ZOD : DESCRIPTION_OUTPUT_ZOD;
  const provider = providerOf(model);
  const imports = [...providerImportEntries(new Set(provider === undefined ? [] : [provider]))].map(
    ([mod, names]) => `import { ${names.join(", ")} } from ${JSON.stringify(mod)};`,
  );
  return [
    // `run` is INJECTED by the runner, not exported by `mithril` — importing it shadows the global
    // with undefined and the program dies on `run.call`.
    `import { agent } from "mithril";`,
    ...imports,
    `import { z } from "zod";`,
    ``,
    // groq is reached through an openai-compatible provider const, exactly as generateProject emits it.
    ...(provider === "groq" ? [GROQ_PROVIDER_DECL, ``] : []),
    `const drafter = agent({`,
    `  model: ${modelExpr(model)},`,
    `  instructions: "You design AI agents. Reply with ONLY a JSON object matching the schema.",`,
    // `tools` is a LIST — an object literal here is spread by the loop and throws "not iterable".
    `  tools: [],`,
    `  output: ${output},`,
    `});`,
    ``,
    `await run(drafter, ${JSON.stringify(promptFor(req))});`,
  ].join("\n");
}

/** One line naming where a draft goes, for the preview gate and the first-run form. */
export function draftDestination(model: ModelSpec): string {
  if (model.kind === "local") return `the on-device model (${model.model}) — nothing leaves this browser`;
  if (model.kind === "code") return "the model expression you supplied";
  return `${model.model} at ${liveProvider(model.provider).host}, with your key`;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * Validate a raw `object.final` payload into a {@link SpecDraft}, or `null` if unusable.
 *
 * Small local models produce near-misses, so this is tolerant about shape but strict about the two
 * fields that matter: without instructions there is nothing to apply.
 */
export function parseSpecDraft(value: JsonValue): SpecDraft | null {
  if (!isRecord(value)) return null;
  const instructions = str(value["instructions"]);
  if (instructions.length === 0) return null;
  const rawTool = value["tool"];
  let tool: SpecDraft["tool"] = null;
  if (isRecord(rawTool)) {
    const name = str(rawTool["name"]);
    if (name.length > 0) {
      const rawInputs = Array.isArray(rawTool["inputs"]) ? rawTool["inputs"] : [];
      tool = {
        name,
        description: str(rawTool["description"]),
        inputs: rawInputs.flatMap((i) => {
          if (!isRecord(i)) return [];
          const iname = str(i["name"]);
          if (iname.length === 0) return [];
          const t = str(i["type"]);
          const type = t === "number" || t === "boolean" ? t : "text";
          return [{ name: iname, type: type as "text" | "number" | "boolean", description: str(i["description"]) }];
        }),
      };
    }
  }
  return { name: str(value["name"]) || "Untitled agent", instructions, tool };
}

/** Validate a raw `object.final` payload into a {@link DescriptionDraft}, or `null`. */
export function parseDescriptionDraft(value: JsonValue): DescriptionDraft | null {
  if (!isRecord(value)) return null;
  const description = str(value["description"]);
  return description.length === 0 ? null : { description };
}

const ZOD_OF = { text: "z.string()", number: "z.number()", boolean: "z.boolean()" } as const;

/** A snake_case identifier safe to use as a decl id and a wire name. */
export function safeIdent(name: string, fallback: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^(\d)/, "_$1");
  return cleaned.length === 0 ? fallback : cleaned;
}

/** One drafted tool input. */
export type DraftInput = { readonly name: string; readonly type: "text" | "number" | "boolean"; readonly description: string };

/** Build the zod object source for a drafted tool's inputs. */
export function inputsToZod(inputs: readonly DraftInput[]): string {
  if (inputs.length === 0) return "z.object({})";
  const fields = inputs.map((i) => {
    const base = ZOD_OF[i.type];
    const described = i.description.length > 0 ? `${base}.describe(${JSON.stringify(i.description)})` : base;
    return `${safeIdent(i.name, "input")}: ${described}`;
  });
  return `z.object({ ${fields.join(", ")} })`;
}

/**
 * Turn a draft into a runnable {@link ProjectSpec}.
 *
 * The drafted tool gets a placeholder body, never invented network code: a `fetch` to a URL the
 * model guessed would be a silent lie about what the agent does. The Designer's Code section is
 * where the real body goes, and the placeholder says exactly that.
 *
 * The drafted agent runs on the model that drafted it. The alternative — always pinning it to the
 * on-device model — hands back an agent that behaves nothing like the draft you just watched, which
 * is a worse surprise than needing the key you already supplied.
 */
export function draftToSpec(draft: SpecDraft, model: ModelSpec = DRAFT_DEFAULT_MODEL): ProjectSpec {
  const decls: (AgentSpec | ToolSpec)[] = [];
  const toolIds: string[] = [];

  if (draft.tool !== null) {
    const id = safeIdent(draft.tool.name, "tool1");
    toolIds.push(id);
    decls.push({
      kind: "tool",
      id,
      name: id,
      description: draft.tool.description,
      inputSchema: { zod: inputsToZod(draft.tool.inputs) },
      execute: { code: stubBody(draft.tool.inputs.map((i) => safeIdent(i.name, "input"))) },
    });
  }

  decls.push({ kind: "agent", id: "assistant", model, instructions: draft.instructions, tools: toolIds });

  return {
    specVersion: SPEC_VERSION,
    name: draft.name,
    decls,
    entry: { target: "assistant", input: "" },
  };
}
