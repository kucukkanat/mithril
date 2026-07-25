import type { JsonValue } from "./primitives.ts";
import type { StandardSchemaV1 } from "./standard-schema.ts";

// §10.5 — Standard Schema → JSON Schema. The Standard Schema contract is validation-only: it exposes no
// structural introspection, so a *general* converter is impossible from the interface alone. Instead we
// recover a real JSON Schema from any of three sources, in priority order:
//   1. a caller-supplied `convert` (e.g. `z.toJSONSchema` from Zod v4, or a Valibot adapter),
//   2. a self-describing schema (a `toJsonSchema()`/`toJSONSchema()` method, or a `jsonSchema` property —
//      the shape produced by {@link withJsonSchema}),
//   3. otherwise a permissive `{ type: "object" }` (the honest fallback — the model still gets the tool,
//      just without typed parameters).

/** A JSON Schema document — itself an ordinary {@link JsonValue}. */
export type JsonSchema = JsonValue;

/** The permissive fallback parameters emitted when a schema can't be described. */
export const PERMISSIVE_OBJECT: JsonSchema = { type: "object", additionalProperties: true };

/**
 * A caller-supplied converter from a {@link StandardSchemaV1} to a {@link JsonSchema}.
 *
 * @remarks Return `undefined` to defer to the next strategy. The canonical use is passing a validator's
 * own converter, e.g. `(s) => z.toJSONSchema(s as z.ZodType)` for Zod v4.
 */
export type JsonSchemaConverter = (schema: StandardSchemaV1<unknown, unknown>) => JsonSchema | undefined;

// Read a self-describing schema's embedded JSON Schema, tolerating a thrown method.
function selfDescribed(schema: StandardSchemaV1<unknown, unknown>): JsonSchema | undefined {
  const s = schema as {
    toJsonSchema?: () => JsonValue;
    toJSONSchema?: () => JsonValue;
    jsonSchema?: JsonValue;
  };
  try {
    if (typeof s.toJsonSchema === "function") return s.toJsonSchema();
    if (typeof s.toJSONSchema === "function") return s.toJSONSchema();
    if (s.jsonSchema !== undefined) return s.jsonSchema;
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Convert a {@link StandardSchemaV1} to a JSON Schema for provider tool-parameter definitions.
 *
 * @param schema - the tool's input schema.
 * @param convert - an optional validator-specific converter, tried first (e.g. Zod v4's `z.toJSONSchema`).
 * @returns the derived JSON Schema, or {@link PERMISSIVE_OBJECT} when the schema can't be described.
 * @remarks Standard Schema exposes no structural introspection, so this recovers a schema from a caller
 * converter, a self-describing schema (see {@link withJsonSchema}), or the permissive fallback — never by
 * guessing shape from the validator. Attach a schema explicitly with {@link withJsonSchema} for a
 * dependency-free path.
 * @example
 * ```ts
 * import { toJsonSchema } from "@mithril/core/protocol";
 * import { z } from "zod";
 *
 * const params = toJsonSchema(z.object({ city: z.string() }), (s) => z.toJSONSchema(s as z.ZodType));
 * ```
 */
export function toJsonSchema(schema: StandardSchemaV1<unknown, unknown>, convert?: JsonSchemaConverter): JsonSchema {
  const custom = convert?.(schema);
  if (custom !== undefined) return custom;
  const described = selfDescribed(schema);
  if (described !== undefined) return described;
  return PERMISSIVE_OBJECT;
}

/**
 * Attach an explicit JSON Schema to a Standard Schema so {@link toJsonSchema} recovers it with no converter.
 *
 * @typeParam In - the schema's input type.
 * @typeParam Out - the schema's validated output type.
 * @param schema - any Standard Schema (its `~standard` validator is preserved unchanged).
 * @param jsonSchema - the JSON Schema to expose for provider tool definitions.
 * @returns the same schema with a `jsonSchema` property carrying `jsonSchema`.
 * @remarks The dependency-free path to typed tool parameters: validate with any validator, describe with a
 * hand-written or generated JSON Schema.
 * @example
 * ```ts
 * import { withJsonSchema } from "@mithril/core/protocol";
 *
 * const citySchema = withJsonSchema(myValidator, {
 *   type: "object",
 *   properties: { city: { type: "string" } },
 *   required: ["city"],
 * });
 * ```
 */
export function withJsonSchema<In, Out>(
  schema: StandardSchemaV1<In, Out>,
  jsonSchema: JsonSchema,
): StandardSchemaV1<In, Out> {
  // The extra `jsonSchema` property is read structurally by `toJsonSchema`; it is not part of the
  // Standard Schema contract, so widen at the boundary.
  return { ...schema, jsonSchema } as StandardSchemaV1<In, Out>;
}

// ── §10.5b — JSON Schema → Standard Schema ──────────────────────────────────────────────────────────
// The inverse direction, and the bridge a *runtime-defined* tool needs: a model emits JSON Schema, and the
// tool built from it must validate its own input locally. Zero-dependency, so core stays validator-free.
// Deliberately a SUBSET, compiled once at construction: every keyword is enforced, explicitly inert, or
// rejected up front — never silently half-applied, because a schema that appears to constrain but doesn't
// is worse than no schema at all.

// Everything not listed below is treated as an annotation and ignored, which is what JSON Schema itself
// says unknown keywords are. That covers `title`/`description`/`default`/`examples`/`format` and friends.
// `format` is deliberately in that bucket: honouring it would mean shipping email/uri/date validators, and
// a half-implemented `format` is exactly the quiet lie this module refuses. `default` is not injected
// either — this is a validator, not a coercer.
//
// Rejected at construction: each needs machinery (reference resolution, exactly-one-match bookkeeping,
// cross-keyword annotation tracking) whose absence would change what validates.
const UNSUPPORTED_KEYWORDS: ReadonlySet<string> = new Set([
  "$ref",
  "$dynamicRef",
  "$dynamicAnchor",
  "oneOf",
  "allOf",
  "not",
  "if",
  "then",
  "else",
  "patternProperties",
  "propertyNames",
  "dependentSchemas",
  "dependentRequired",
  "prefixItems",
  "contains",
  "minContains",
  "maxContains",
  "unevaluatedProperties",
  "unevaluatedItems",
  "uniqueItems",
  "minProperties",
  "maxProperties",
]);

const JSON_TYPE_NAMES: ReadonlySet<string> = new Set(["object", "array", "string", "number", "integer", "boolean", "null"]);

/** Thrown by {@link fromJsonSchema} when a document uses a keyword outside its supported subset. */
export class UnsupportedJsonSchemaError extends Error {
  /**
   * @param keyword - the offending keyword (e.g. `"oneOf"`).
   * @param location - where it appeared, as a dotted path from the document root (e.g. `"properties.user"`).
   */
  constructor(
    readonly keyword: string,
    readonly location: string,
  ) {
    super(
      `Unsupported JSON Schema keyword "${keyword}" at ${location}. ` +
        `fromJsonSchema supports a draft 2020-12 subset; pass { onUnsupported: "ignore" } to drop it and validate the rest.`,
    );
    this.name = "UnsupportedJsonSchemaError";
  }
}

/** Options for {@link fromJsonSchema}. */
export interface FromJsonSchemaOptions {
  /**
   * How to handle a keyword outside the supported subset. `"throw"` (default) rejects at construction;
   * `"ignore"` drops the keyword and validates everything else.
   */
  readonly onUnsupported?: "throw" | "ignore";
}

type Issue = StandardSchemaV1.Issue;
type PathSegment = StandardSchemaV1.PathSegment;
type Check = (value: unknown, path: readonly PathSegment[], issues: Issue[]) => void;

// Dotted rendering of an instance path. Load-bearing: `resolveInput` joins only issue *messages* when it
// builds an INVALID_TOOL_INPUT error, so a path that lives solely in `issue.path` never reaches the model.
function pathLabel(path: readonly PathSegment[]): string {
  return path.map((p) => String(p.key)).join(".");
}

function issue(path: readonly PathSegment[], message: string): Issue {
  const label = pathLabel(path);
  return { message: label === "" ? message : `${label}: ${message}`, path };
}

// The JSON Schema type name of a runtime value. `integer` is reported for whole numbers so a `type:
// "integer"` check is a plain membership test; `number` accepts both (per spec).
function jsonTypeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  switch (typeof v) {
    case "string":
      return "string";
    case "boolean":
      return "boolean";
    case "number":
      return Number.isInteger(v) ? "integer" : "number";
    case "object":
      return "object";
    default:
      return typeof v;
  }
}

function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => jsonEqual(x, b[i]));
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao);
  return ak.length === Object.keys(bo).length && ak.every((k) => Object.hasOwn(bo, k) && jsonEqual(ao[k], bo[k]));
}

function num(v: JsonValue | undefined, keyword: string, where: string): number | undefined {
  if (v === undefined) return undefined;
  if (typeof v !== "number") throw new UnsupportedJsonSchemaError(keyword, `${where} (expected a number, got ${jsonTypeOf(v)})`);
  return v;
}

// Compile one (sub)schema into a total check. All structural errors surface here, at construction.
function compile(doc: JsonSchema, mode: "throw" | "ignore", where: string): Check {
  // Boolean schemas: `true` accepts everything, `false` accepts nothing.
  if (typeof doc === "boolean") {
    return doc ? () => {} : (_v, path, issues) => issues.push(issue(path, "schema is `false`; no value is valid"));
  }
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
    throw new UnsupportedJsonSchemaError("<schema>", `${where} (expected an object or boolean schema, got ${jsonTypeOf(doc)})`);
  }
  const s = doc as Record<string, JsonValue>;

  for (const k of Object.keys(s)) {
    if (UNSUPPORTED_KEYWORDS.has(k) && mode === "throw") throw new UnsupportedJsonSchemaError(k, where);
  }

  const checks: Check[] = [];

  // ── type ──
  const rawType = s["type"];
  if (rawType !== undefined) {
    const names = (Array.isArray(rawType) ? rawType : [rawType]).map((t) => {
      if (typeof t !== "string" || !JSON_TYPE_NAMES.has(t)) throw new UnsupportedJsonSchemaError("type", `${where} (unknown type ${JSON.stringify(t)})`);
      return t;
    });
    const set = new Set(names);
    checks.push((v, path, issues) => {
      const actual = jsonTypeOf(v);
      const ok = set.has(actual) || (actual === "integer" && set.has("number"));
      if (!ok) issues.push(issue(path, `expected ${names.join(" or ")}, got ${actual}`));
    });
  }

  // ── const / enum ──
  if (Object.hasOwn(s, "const")) {
    const expected = s["const"];
    checks.push((v, path, issues) => {
      if (!jsonEqual(v, expected)) issues.push(issue(path, `expected the constant ${JSON.stringify(expected)}`));
    });
  }
  const rawEnum = s["enum"];
  if (rawEnum !== undefined) {
    if (!Array.isArray(rawEnum)) throw new UnsupportedJsonSchemaError("enum", `${where} (expected an array)`);
    checks.push((v, path, issues) => {
      if (!rawEnum.some((e) => jsonEqual(v, e))) issues.push(issue(path, `expected one of ${rawEnum.map((e) => JSON.stringify(e)).join(", ")}`));
    });
  }

  // ── anyOf ── (first branch that validates wins; on total failure the *branch* issues are discarded in
  // favour of one message, because N branches' worth of noise is unactionable for a model.)
  const rawAnyOf = s["anyOf"];
  if (rawAnyOf !== undefined) {
    if (!Array.isArray(rawAnyOf)) throw new UnsupportedJsonSchemaError("anyOf", `${where} (expected an array)`);
    const branches = rawAnyOf.map((b, i) => compile(b, mode, `${where}.anyOf[${i}]`));
    checks.push((v, path, issues) => {
      const ok = branches.some((b) => {
        const scratch: Issue[] = [];
        b(v, path, scratch);
        return scratch.length === 0;
      });
      if (!ok) issues.push(issue(path, `did not match any of the ${branches.length} allowed schemas`));
    });
  }

  // ── object ──
  const rawProps = s["properties"];
  const props: [string, Check][] = [];
  if (rawProps !== undefined) {
    if (rawProps === null || typeof rawProps !== "object" || Array.isArray(rawProps)) {
      throw new UnsupportedJsonSchemaError("properties", `${where} (expected an object)`);
    }
    for (const [k, sub] of Object.entries(rawProps)) props.push([k, compile(sub, mode, `${where}.properties.${k}`)]);
  }
  const rawRequired = s["required"];
  const required: string[] = [];
  if (rawRequired !== undefined) {
    if (!Array.isArray(rawRequired) || rawRequired.some((r) => typeof r !== "string")) {
      throw new UnsupportedJsonSchemaError("required", `${where} (expected an array of strings)`);
    }
    required.push(...(rawRequired as string[]));
  }
  const rawAdditional = s["additionalProperties"];
  const additional: Check | false | undefined =
    rawAdditional === undefined || rawAdditional === true ? undefined : rawAdditional === false ? false : compile(rawAdditional, mode, `${where}.additionalProperties`);

  if (props.length > 0 || required.length > 0 || additional !== undefined) {
    const known = new Set(props.map(([k]) => k));
    checks.push((v, path, issues) => {
      if (v === null || typeof v !== "object" || Array.isArray(v)) return; // a `type` check, if any, already reported it
      const o = v as Record<string, unknown>;
      for (const r of required) if (!Object.hasOwn(o, r)) issues.push(issue(path, `missing required property "${r}"`));
      for (const [k, check] of props) if (Object.hasOwn(o, k)) check(o[k], [...path, { key: k }], issues);
      if (additional !== undefined) {
        for (const k of Object.keys(o)) {
          if (known.has(k)) continue;
          if (additional === false) issues.push(issue(path, `unexpected property "${k}"`));
          else additional(o[k], [...path, { key: k }], issues);
        }
      }
    });
  }

  // ── array ──
  const rawItems = s["items"];
  if (rawItems !== undefined) {
    // An array `items` is the draft-07 tuple form, replaced by `prefixItems` in 2020-12.
    if (Array.isArray(rawItems)) throw new UnsupportedJsonSchemaError("items (tuple form)", `${where}; use prefixItems, which is also unsupported`);
    const item = compile(rawItems, mode, `${where}.items`);
    checks.push((v, path, issues) => {
      if (!Array.isArray(v)) return;
      v.forEach((el, i) => item(el, [...path, { key: i }], issues));
    });
  }
  const minItems = num(s["minItems"], "minItems", where);
  const maxItems = num(s["maxItems"], "maxItems", where);
  if (minItems !== undefined || maxItems !== undefined) {
    checks.push((v, path, issues) => {
      if (!Array.isArray(v)) return;
      if (minItems !== undefined && v.length < minItems) issues.push(issue(path, `expected at least ${minItems} items, got ${v.length}`));
      if (maxItems !== undefined && v.length > maxItems) issues.push(issue(path, `expected at most ${maxItems} items, got ${v.length}`));
    });
  }

  // ── string ──
  const minLength = num(s["minLength"], "minLength", where);
  const maxLength = num(s["maxLength"], "maxLength", where);
  const rawPattern = s["pattern"];
  let pattern: RegExp | undefined;
  if (rawPattern !== undefined) {
    if (typeof rawPattern !== "string") throw new UnsupportedJsonSchemaError("pattern", `${where} (expected a string)`);
    try {
      pattern = new RegExp(rawPattern, "u");
    } catch {
      throw new UnsupportedJsonSchemaError("pattern", `${where} (not a valid regular expression: ${JSON.stringify(rawPattern)})`);
    }
  }
  if (minLength !== undefined || maxLength !== undefined || pattern !== undefined) {
    checks.push((v, path, issues) => {
      if (typeof v !== "string") return;
      if (minLength !== undefined && v.length < minLength) issues.push(issue(path, `expected at least ${minLength} characters, got ${v.length}`));
      if (maxLength !== undefined && v.length > maxLength) issues.push(issue(path, `expected at most ${maxLength} characters, got ${v.length}`));
      if (pattern !== undefined && !pattern.test(v)) issues.push(issue(path, `expected to match ${pattern.source}`));
    });
  }

  // ── number ──
  const minimum = num(s["minimum"], "minimum", where);
  const maximum = num(s["maximum"], "maximum", where);
  const exclusiveMinimum = num(s["exclusiveMinimum"], "exclusiveMinimum", where);
  const exclusiveMaximum = num(s["exclusiveMaximum"], "exclusiveMaximum", where);
  const multipleOf = num(s["multipleOf"], "multipleOf", where);
  if (
    minimum !== undefined ||
    maximum !== undefined ||
    exclusiveMinimum !== undefined ||
    exclusiveMaximum !== undefined ||
    multipleOf !== undefined
  ) {
    checks.push((v, path, issues) => {
      if (typeof v !== "number") return;
      if (minimum !== undefined && v < minimum) issues.push(issue(path, `expected >= ${minimum}, got ${v}`));
      if (maximum !== undefined && v > maximum) issues.push(issue(path, `expected <= ${maximum}, got ${v}`));
      if (exclusiveMinimum !== undefined && v <= exclusiveMinimum) issues.push(issue(path, `expected > ${exclusiveMinimum}, got ${v}`));
      if (exclusiveMaximum !== undefined && v >= exclusiveMaximum) issues.push(issue(path, `expected < ${exclusiveMaximum}, got ${v}`));
      // Tolerance rather than `%`: 0.3 % 0.1 is not 0 in binary floating point.
      if (multipleOf !== undefined && Math.abs(v / multipleOf - Math.round(v / multipleOf)) > 1e-9) {
        issues.push(issue(path, `expected a multiple of ${multipleOf}, got ${v}`));
      }
    });
  }

  if (checks.length === 0) return () => {};
  return (v, path, issues) => {
    for (const c of checks) c(v, path, issues);
  };
}

/**
 * Compile a JSON Schema (draft 2020-12 subset) into a {@link StandardSchemaV1} validator.
 *
 * @param doc - the JSON Schema document. A boolean schema (`true`/`false`) is accepted.
 * @param opts - see {@link FromJsonSchemaOptions}.
 * @returns a self-describing Standard Schema: {@link toJsonSchema} recovers `doc` unchanged, so a tool
 * built this way both validates locally *and* advertises real parameters to the model.
 * @throws {@link UnsupportedJsonSchemaError} at construction — never at validate time — for a keyword
 * outside the subset, a malformed subschema, or an invalid `pattern`.
 *
 * @remarks
 * The inverse of {@link toJsonSchema}, and the piece a runtime-defined tool needs: a model emits JSON
 * Schema, and the tool built from it must validate its own input. Zero-dependency, so core stays
 * validator-free.
 *
 * **Enforced:** `type` (including unions like `["string","null"]`; `integer` matches whole numbers and
 * `number` matches both), `properties`, `required`, `additionalProperties`, `items`, `minItems`,
 * `maxItems`, `enum`, `const`, `anyOf`, `minLength`, `maxLength`, `pattern`, `minimum`, `maximum`,
 * `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`. An empty schema (`{}`) accepts anything.
 *
 * **Carried but not enforced:** `title`, `description`, `default`, `examples`, `format`, and the other
 * annotations. `format` is deliberately not validated and `default` is deliberately not injected — this
 * is a validator, not a coercer.
 *
 * **Rejected:** `$ref`, `$dynamicRef`, `oneOf`, `allOf`, `not`, `if`/`then`/`else`, `patternProperties`,
 * `propertyNames`, `dependentSchemas`, `dependentRequired`, `prefixItems`, `contains`, `uniqueItems`,
 * `minProperties`, `maxProperties`, `unevaluatedProperties`, `unevaluatedItems`. `oneOf` is refused
 * rather than aliased to `anyOf`: exactly-one-match is a different assertion, and quietly widening it
 * would let invalid input through a schema that looks like it forbids it. `$defs`/`definitions` are
 * inert (they only matter via `$ref`, which is rejected).
 *
 * Issue messages are prefixed with the dotted instance path (`user.0.id: expected string, got number`)
 * because the loop's `INVALID_TOOL_INPUT` error joins issue *messages* only — a path carried solely in
 * `issue.path` would never reach the model.
 *
 * @example
 * ```ts
 * import { fromJsonSchema, toJsonSchema } from "@mithril/core/protocol";
 *
 * const schema = fromJsonSchema({
 *   type: "object",
 *   properties: { city: { type: "string" }, days: { type: "integer", minimum: 1 } },
 *   required: ["city"],
 *   additionalProperties: false,
 * });
 *
 * await schema["~standard"].validate({ city: "NYC", days: 3 }); // { value: … }
 * await schema["~standard"].validate({ days: 0 });              // { issues: [ …missing "city"…, …>= 1… ] }
 * ```
 */
export function fromJsonSchema(doc: JsonSchema, opts?: FromJsonSchemaOptions): StandardSchemaV1<unknown, JsonValue> {
  const check = compile(doc, opts?.onUnsupported ?? "throw", "<root>");
  return withJsonSchema<unknown, JsonValue>(
    {
      "~standard": {
        version: 1,
        vendor: "mithril",
        validate: (value) => {
          const issues: Issue[] = [];
          check(value, [], issues);
          return issues.length > 0 ? { issues } : { value: value as JsonValue };
        },
      },
    },
    doc,
  );
}
