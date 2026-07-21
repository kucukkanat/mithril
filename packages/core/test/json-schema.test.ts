import { expect, test } from "bun:test";
import type { JsonValue, StandardSchemaV1 } from "../src/protocol/index.ts";
import { PERMISSIVE_OBJECT, toJsonSchema, withJsonSchema } from "../src/protocol/index.ts";

function bareSchema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}

test("falls back to a permissive object for a non-describing schema", () => {
  expect(toJsonSchema(bareSchema<{ x: number }>())).toEqual(PERMISSIVE_OBJECT);
});

test("withJsonSchema attaches a JSON Schema the converter recovers, preserving validation", async () => {
  const js: JsonValue = { type: "object", properties: { city: { type: "string" } }, required: ["city"] };
  const schema = withJsonSchema(bareSchema<{ city: string }>(), js);
  expect(toJsonSchema(schema)).toEqual(js);
  // validation still works (the ~standard validator is untouched)
  const r = await schema["~standard"].validate({ city: "NYC" });
  expect(r.issues).toBeUndefined();
});

test("recovers a JSON Schema from a self-describing toJSONSchema() method", () => {
  const js: JsonValue = { type: "object", properties: { n: { type: "number" } } };
  const schema = { ...bareSchema<{ n: number }>(), toJSONSchema: () => js };
  expect(toJsonSchema(schema)).toEqual(js);
});

test("a caller-supplied converter takes priority", () => {
  const converted: JsonValue = { type: "object", properties: { a: { type: "boolean" } } };
  expect(toJsonSchema(bareSchema<{ a: boolean }>(), () => converted)).toEqual(converted);
});

test("a throwing self-describe method degrades to the fallback", () => {
  const schema = {
    ...bareSchema<unknown>(),
    toJsonSchema() {
      throw new Error("boom");
    },
  };
  expect(toJsonSchema(schema)).toEqual(PERMISSIVE_OBJECT);
});
