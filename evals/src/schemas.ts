/**
 * Named structured-output schemas for the structured-output suite. A test opts into structured output
 * by setting an `outputSchema` var; {@link outputSchema} maps that name to the Standard Schema handed to
 * `agent({ output })`, so the harness parses + validates the model's final text into a typed object.
 */
import type { JsonSchema, JsonSchemaConverter } from "@mithril/core/protocol";
import { z } from "zod/v4";

const SCHEMAS = {
  person: z.object({
    name: z.string(),
    age: z.number().int(),
    email: z.string(),
  }),
  sentiment: z.object({
    sentiment: z.enum(["positive", "negative", "neutral"]),
    // Optional: tiny local models reliably emit the label but often omit a numeric confidence. Keeping it
    // optional makes the suite measure parse + shape correctness, not penalize an omitted best-effort field.
    confidence: z.number().optional(),
  }),
} as const;

/** The schema names a test may request via its `outputSchema` var. */
export type SchemaName = keyof typeof SCHEMAS;

/** Resolve an `outputSchema` var to a Standard Schema for `agent({ output })`; unknown/empty ⇒ `undefined`. */
export function outputSchema(name: unknown): z.ZodTypeAny | undefined {
  if (typeof name !== "string") return undefined;
  return (SCHEMAS as Record<string, z.ZodTypeAny>)[name];
}

/**
 * A JSON-Schema converter for `agent({ outputSchema })`, so the harness injects the concrete field
 * names/types into the prompt. Uses Zod v4's `z.toJSONSchema`; returns `undefined` on any non-Zod schema so
 * the harness falls back gracefully.
 */
export const outputSchemaConverter: JsonSchemaConverter = (schema) => {
  try {
    return z.toJSONSchema(schema as z.ZodType) as JsonSchema;
  } catch {
    return undefined;
  }
};
