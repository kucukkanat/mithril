/*
 * The Fields ⇄ zod bridge, and the link between an input name and the code that reads it.
 *
 * Pure so the round trip is testable: editing a field rewrites the zod source, and reading the zod
 * source rebuilds the fields. Anything this cannot represent stays editable as raw zod — the panel
 * offers both views precisely because the field editor is a convenience, not the schema.
 */
import type { JsonValue } from "@mithril/core/protocol";
import { highlight, type TokenKind } from "./highlight.ts";
import { parseInputs } from "./pick-score.ts";

export type ParamType = "text" | "number" | "boolean";

export interface Param {
  readonly name: string;
  readonly type: ParamType;
  readonly description: string;
}

const ZOD_OF: Record<ParamType, string> = { text: "z.string()", number: "z.number()", boolean: "z.boolean()" };

/** Classify a field's zod expression. Anything unrecognised reads as text — the safe default. */
export const typeOfZod = (expr: string): ParamType => (expr.includes("z.number()") ? "number" : expr.includes("z.boolean()") ? "boolean" : "text");

/** Read a zod object source into editable fields. */
export const paramsOf = (zod: string): readonly Param[] =>
  parseInputs(zod).map((p) => ({ name: p.name, description: p.description, type: typeOfZod(p.expr) }));

/** Rebuild zod object source from edited fields. */
export const toZod = (params: readonly Param[]): string =>
  params.length === 0
    ? "z.object({})"
    : `z.object({ ${params
        .map((p) => `${p.name}: ${p.description.length > 0 ? `${ZOD_OF[p.type]}.describe(${JSON.stringify(p.description)})` : ZOD_OF[p.type]}`)
        .join(", ")} })`;

/** How a tool body uses its declared inputs. */
export interface BodyUse {
  /** Fields the parameter pattern binds AND the body references — genuinely used. */
  readonly read: ReadonlySet<string>;
  /**
   * Fields the body references but the parameter pattern never binds.
   *
   * Referencing one of these is a `ReferenceError` at call time, not a style nit.
   */
  readonly unbound: ReadonlySet<string>;
}

// Identifiers a destructuring pattern actually introduces. `{ a, b: c, ...rest }` binds a, c and rest —
// note `b` is NOT bound, only renamed from. Deliberately conservative: a pattern this cannot read yields
// no bindings, so nothing gets claimed as "read" on a guess.
function boundNames(pattern: string): ReadonlySet<string> {
  const out = new Set<string>();
  const braces = /\{([^}]*)\}/.exec(pattern);
  if (braces === null) return out;
  for (const part of (braces[1] ?? "").split(",")) {
    const piece = part.trim();
    if (piece === "") continue;
    // `b: c` binds c; `a = 1` binds a; `...rest` binds rest.
    const renamed = /:\s*([A-Za-z_$][\w$]*)/.exec(piece);
    const bare = /^\.{0,3}\s*([A-Za-z_$][\w$]*)/.exec(piece);
    const name = renamed?.[1] ?? bare?.[1];
    if (name !== undefined) out.add(name);
  }
  return out;
}

/**
 * Work out which declared inputs a tool body genuinely reads, and which it only appears to.
 *
 * @param code - the body source.
 * @param names - the field names declared by the input schema.
 * @returns the fields bound-and-read, and the fields referenced without ever being bound.
 *
 * @remarks A name is only "read" when the PARAMETER PATTERN binds it. Matching the body alone reported the
 * free variable in `async ({ input }) => ({ echoed: `${personName}…` })` as a correctly-consumed input —
 * the body does mention `personName`, but nothing binds it, so the call throws. That badge said "1 of 1
 * input read" about a `ReferenceError`, which is worse than saying nothing.
 *
 * A body that binds the argument object whole (`async (args) => args.city`) is handled too: fields are
 * read through property access on that identifier.
 *
 * @example
 * ```ts
 * readNames("async ({ input }) => personName", ["personName"]);
 * // → { read: Set {}, unbound: Set { "personName" } }
 * ```
 */
export function readNames(code: string, names: readonly string[]): BodyUse {
  const arrow = code.indexOf("=>");
  const head = arrow === -1 ? "" : code.slice(0, arrow);
  const body = arrow === -1 ? code : code.slice(arrow + 2);
  const mentions = (n: string): boolean => new RegExp(`\\b${n}\\b`).test(body);

  // No parameter list at all (a bare fragment) — every mention is taken at face value, as before.
  if (arrow === -1) return { read: new Set(names.filter(mentions)), unbound: new Set() };

  const bound = boundNames(head);
  // `async (args) => …` binds the whole object; a field is read through property access on it.
  const whole = /\(\s*([A-Za-z_$][\w$]*)\s*[),]/.exec(head)?.[1];
  const read = new Set<string>();
  const unbound = new Set<string>();
  for (const n of names) {
    if (bound.has(n)) {
      if (mentions(n)) read.add(n);
    } else if (whole !== undefined && new RegExp(`\\b${whole}\\s*(\\.\\s*${n}\\b|\\[\\s*["'\`]${n}["'\`])`).test(body)) {
      read.add(n);
    } else if (mentions(n)) {
      unbound.add(n);
    }
  }
  return { read, unbound };
}

/** A token of a code line: syntax-coloured, and carrying an input name when it links back to a field. */
export interface CodeToken {
  readonly text: string;
  readonly name: string | null;
  readonly kind: TokenKind;
}

/**
 * Split a line into syntax-coloured tokens, marking those that are input names.
 *
 * Colouring runs first, so a name is only ever linked where the scanner saw a bare identifier — an
 * occurrence inside a string literal or comment stays one uncut, uncoloured-as-code token, which is
 * both correct (it isn't a read) and what keeps the string's colour intact.
 */
export function tokenize(line: string, names: readonly string[]): readonly CodeToken[] {
  const bound = new Set(names);
  return highlight(line).map((t) => ({ text: t.text, kind: t.kind, name: t.kind === "plain" && bound.has(t.text) ? t.text : null }));
}

/**
 * The body a newly-created tool starts with.
 *
 * @param fields - the input names the schema declares, in order.
 * @returns an `async` arrow whose parameter pattern binds exactly those fields.
 *
 * @remarks THE one scaffold. There used to be two that disagreed: `newTool` hardcoded
 * `async ({ input }) => ({ echoed: input })` regardless of the schema, while the drafting path derived the
 * pattern from the real field names. Editing a field rewrote the schema and left the hardcoded pattern
 * behind, which is how a body came to destructure `{ input }` while referencing `personName` — a
 * ReferenceError manufactured out of a self-consistent scaffold.
 *
 * It returns `{ ok: true }` and carries a `TODO` marker on purpose: a stub that invents plausible data
 * teaches the model, in context, that inventing plausible data is in bounds.
 * @example
 * ```ts
 * stubBody(["city"]); // async ({ city }) => { … return { ok: true }; }
 * ```
 */
export function stubBody(fields: readonly string[]): string {
  const pattern = fields.length > 0 ? `{ ${fields.join(", ")} }` : "";
  return `async (${pattern}) => {\n  // TODO: call your real API here. Returns a stub until you do.\n  return { ok: true };\n}`;
}

/**
 * Parse an example call typed into the Examples editor.
 *
 * @param raw - the text as typed.
 * @returns the parsed value, or `undefined` when it is not yet valid JSON.
 *
 * @remarks Returning `undefined` rather than throwing is what lets the editor commit on blur only when the
 * text parses — a half-typed object must never reach the spec, because codegen would emit it verbatim.
 */
export function parseExample(raw: string): JsonValue | undefined {
  try {
    return JSON.parse(raw) as JsonValue;
  } catch {
    return undefined;
  }
}

/**
 * Explain why an example would not survive the tool's own input schema, if it wouldn't.
 *
 * @param raw - the example text as typed.
 * @param names - the field names the schema declares.
 * @returns a short problem statement, or `null` when the example is usable.
 *
 * @remarks An example that contradicts the schema is worse than none: it is folded verbatim into the wire
 * description, so it teaches the model a call shape the loop will then reject as invalid input.
 */
export function exampleError(raw: string, names: readonly string[]): string | null {
  const parsed = parseExample(raw);
  if (parsed === undefined) return "not valid JSON";
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return "must be an object";
  const unknown = Object.keys(parsed).filter((k) => !names.includes(k));
  if (unknown.length > 0) return `not in the schema: ${unknown.join(", ")}`;
  const missing = names.filter((n) => !(n in parsed));
  return missing.length > 0 ? `missing: ${missing.join(", ")}` : null;
}

/**
 * A starting example for a tool's current fields.
 *
 * @param params - the tool's inputs.
 * @returns an object with one placeholder per field — `{}` when the tool takes no arguments, which is
 * itself the useful example.
 */
export function exampleTemplate(params: readonly Param[]): JsonValue {
  const of: Record<ParamType, JsonValue> = { text: "", number: 0, boolean: false };
  return Object.fromEntries(params.map((p) => [p.name, of[p.type]])) as JsonValue;
}
