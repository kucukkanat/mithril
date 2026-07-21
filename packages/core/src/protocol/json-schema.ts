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
