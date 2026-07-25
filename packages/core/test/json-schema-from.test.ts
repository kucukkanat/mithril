import { expect, test } from "bun:test";
import type { JsonSchema, StandardSchemaV1 } from "../src/protocol/index.ts";
import { fromJsonSchema, toJsonSchema, UnsupportedJsonSchemaError } from "../src/protocol/index.ts";

// The compiled validator is synchronous, but the Standard Schema contract allows a promise — await to stay
// honest about the contract rather than the implementation.
async function check(doc: JsonSchema, value: unknown): Promise<StandardSchemaV1.Result<unknown>> {
  return await fromJsonSchema(doc)["~standard"].validate(value);
}
async function ok(doc: JsonSchema, value: unknown): Promise<void> {
  const r = await check(doc, value);
  expect(r.issues).toBeUndefined();
}
async function messages(doc: JsonSchema, value: unknown): Promise<readonly string[]> {
  const r = await check(doc, value);
  return (r.issues ?? []).map((i) => i.message);
}

// ── type ──────────────────────────────────────────────────────────────────────────────────────────────

test("type accepts matching values and reports the actual type otherwise", async () => {
  await ok({ type: "string" }, "hi");
  expect(await messages({ type: "string" }, 3)).toEqual(["expected string, got integer"]);
  await ok({ type: "boolean" }, false);
  await ok({ type: "null" }, null);
  await ok({ type: "array" }, []);
  await ok({ type: "object" }, {});
});

test("integer matches whole numbers only, and number matches both", async () => {
  await ok({ type: "integer" }, 4);
  expect(await messages({ type: "integer" }, 4.5)).toEqual(["expected integer, got number"]);
  await ok({ type: "number" }, 4);
  await ok({ type: "number" }, 4.5);
});

test("a type union accepts any member", async () => {
  const doc: JsonSchema = { type: ["string", "null"] };
  await ok(doc, "hi");
  await ok(doc, null);
  expect(await messages(doc, 1)).toEqual(["expected string or null, got integer"]);
});

test("an empty schema accepts anything, and boolean schemas are honoured", async () => {
  await ok({}, { anything: [1, "two", null] });
  await ok(true, 42);
  expect(await messages(false, 42)).toEqual(["schema is `false`; no value is valid"]);
});

// ── objects ───────────────────────────────────────────────────────────────────────────────────────────

test("required reports each missing property", async () => {
  const doc: JsonSchema = { type: "object", properties: { a: { type: "string" }, b: { type: "string" } }, required: ["a", "b"] };
  expect(await messages(doc, {})).toEqual(['missing required property "a"', 'missing required property "b"']);
  await ok(doc, { a: "x", b: "y" });
});

test("additionalProperties defaults to permissive and false rejects extras", async () => {
  const base = { type: "object", properties: { a: { type: "string" } } } as const;
  await ok(base, { a: "x", extra: 1 });
  expect(await messages({ ...base, additionalProperties: false }, { a: "x", extra: 1 })).toEqual(['unexpected property "extra"']);
});

test("additionalProperties as a schema validates the extras", async () => {
  const doc: JsonSchema = { type: "object", properties: { a: { type: "string" } }, additionalProperties: { type: "number" } };
  await ok(doc, { a: "x", n: 1 });
  expect(await messages(doc, { a: "x", n: "no" })).toEqual(["n: expected number, got string"]);
});

// ── nesting & paths ───────────────────────────────────────────────────────────────────────────────────

test("issues carry a structured path and a dotted-path message prefix", async () => {
  const doc: JsonSchema = {
    type: "object",
    properties: { users: { type: "array", items: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } } },
  };
  const r = await check(doc, { users: [{ id: "a" }, { id: 7 }] });
  expect(r.issues?.length).toBe(1);
  // The message prefix is load-bearing: resolveInput joins messages only, dropping `path`.
  expect(r.issues?.[0]?.message).toBe("users.1.id: expected string, got integer");
  expect(r.issues?.[0]?.path).toEqual([{ key: "users" }, { key: 1 }, { key: "id" }]);
});

test("a nested object reports a missing property at its own path", async () => {
  const doc: JsonSchema = {
    type: "object",
    properties: { user: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  };
  expect(await messages(doc, { user: {} })).toEqual(['user: missing required property "id"']);
});

// ── arrays, strings, numbers ──────────────────────────────────────────────────────────────────────────

test("array bounds are enforced", async () => {
  const doc: JsonSchema = { type: "array", items: { type: "number" }, minItems: 1, maxItems: 2 };
  await ok(doc, [1, 2]);
  expect(await messages(doc, [])).toEqual(["expected at least 1 items, got 0"]);
  expect(await messages(doc, [1, 2, 3])).toEqual(["expected at most 2 items, got 3"]);
});

test("string length and pattern are enforced", async () => {
  const doc: JsonSchema = { type: "string", minLength: 2, maxLength: 4, pattern: "^[a-z]+$" };
  await ok(doc, "abc");
  expect(await messages(doc, "a")).toEqual(["expected at least 2 characters, got 1"]);
  expect(await messages(doc, "abcde")).toEqual(["expected at most 4 characters, got 5"]);
  expect(await messages(doc, "AB")).toEqual(["expected to match ^[a-z]+$"]);
});

test("numeric bounds and multipleOf are enforced", async () => {
  expect(await messages({ type: "number", minimum: 1 }, 0)).toEqual(["expected >= 1, got 0"]);
  expect(await messages({ type: "number", maximum: 1 }, 2)).toEqual(["expected <= 1, got 2"]);
  expect(await messages({ type: "number", exclusiveMinimum: 1 }, 1)).toEqual(["expected > 1, got 1"]);
  expect(await messages({ type: "number", exclusiveMaximum: 1 }, 1)).toEqual(["expected < 1, got 1"]);
  await ok({ type: "number", multipleOf: 0.1 }, 0.3); // binary float: 0.3 % 0.1 !== 0, hence the tolerance
  expect(await messages({ type: "number", multipleOf: 5 }, 7)).toEqual(["expected a multiple of 5, got 7"]);
});

// ── enum / const / anyOf ──────────────────────────────────────────────────────────────────────────────

test("enum and const use deep equality", async () => {
  await ok({ enum: ["a", { x: 1 }] }, { x: 1 });
  expect(await messages({ enum: ["a", "b"] }, "c")).toEqual(['expected one of "a", "b"']);
  await ok({ const: { x: [1, 2] } }, { x: [1, 2] });
  expect(await messages({ const: 5 }, 6)).toEqual(["expected the constant 5"]);
});

test("anyOf passes when a branch matches and collapses to one message when none do", async () => {
  const doc: JsonSchema = { anyOf: [{ type: "string" }, { type: "object", properties: { n: { type: "number" } }, required: ["n"] }] };
  await ok(doc, "hi");
  await ok(doc, { n: 1 });
  expect(await messages(doc, 42)).toEqual(["did not match any of the 2 allowed schemas"]);
});

// ── unsupported keywords ──────────────────────────────────────────────────────────────────────────────

const UNSUPPORTED: readonly (readonly [string, JsonSchema])[] = [
  ["$ref", { $ref: "#/$defs/x" }],
  ["oneOf", { oneOf: [{ type: "string" }] }],
  ["allOf", { allOf: [{ type: "string" }] }],
  ["not", { not: { type: "string" } }],
  ["if", { if: { type: "string" }, then: { minLength: 1 } }],
  ["patternProperties", { patternProperties: { "^a": { type: "string" } } }],
  ["propertyNames", { propertyNames: { pattern: "^a" } }],
  ["dependentRequired", { dependentRequired: { a: ["b"] } }],
  ["prefixItems", { prefixItems: [{ type: "string" }] }],
  ["contains", { contains: { type: "string" } }],
  ["uniqueItems", { type: "array", uniqueItems: true }],
  ["minProperties", { type: "object", minProperties: 1 }],
  ["unevaluatedProperties", { unevaluatedProperties: false }],
];

for (const [keyword, doc] of UNSUPPORTED) {
  test(`${keyword} throws UnsupportedJsonSchemaError at construction`, () => {
    expect(() => fromJsonSchema(doc)).toThrow(UnsupportedJsonSchemaError);
  });
}

test("unsupported keywords throw at construction, never at validate time", () => {
  // The distinction matters: a define-time rejection is actionable, a validate-time one is a mystery.
  try {
    fromJsonSchema({ oneOf: [{ type: "string" }] });
    throw new Error("expected a throw");
  } catch (e) {
    expect(e).toBeInstanceOf(UnsupportedJsonSchemaError);
    expect((e as UnsupportedJsonSchemaError).keyword).toBe("oneOf");
    expect((e as UnsupportedJsonSchemaError).location).toBe("<root>");
  }
});

test("an unsupported keyword nested in a property reports its location", () => {
  try {
    fromJsonSchema({ type: "object", properties: { a: { oneOf: [{ type: "string" }] } } });
    throw new Error("expected a throw");
  } catch (e) {
    expect((e as UnsupportedJsonSchemaError).location).toBe("<root>.properties.a");
  }
});

test('onUnsupported "ignore" drops the keyword and validates the rest', async () => {
  const doc: JsonSchema = { type: "object", properties: { a: { type: "string" } }, required: ["a"], oneOf: [{ type: "string" }] };
  const s = fromJsonSchema(doc, { onUnsupported: "ignore" });
  expect((await s["~standard"].validate({ a: "x" })).issues).toBeUndefined();
  expect((await s["~standard"].validate({})).issues?.length).toBe(1);
});

test("an invalid pattern is rejected at construction", () => {
  expect(() => fromJsonSchema({ type: "string", pattern: "([" })).toThrow(UnsupportedJsonSchemaError);
});

test("a malformed schema node is rejected at construction", () => {
  expect(() => fromJsonSchema({ type: "object", properties: { a: 5 } })).toThrow(UnsupportedJsonSchemaError);
  expect(() => fromJsonSchema({ type: "nonsense" })).toThrow(UnsupportedJsonSchemaError);
  expect(() => fromJsonSchema({ required: "a" })).toThrow(UnsupportedJsonSchemaError);
});

// ── round-trip ────────────────────────────────────────────────────────────────────────────────────────

test("toJsonSchema recovers the original document unchanged", () => {
  const doc: JsonSchema = {
    type: "object",
    description: "carried but not enforced",
    properties: { city: { type: "string" }, days: { type: "integer", minimum: 1 } },
    required: ["city"],
    additionalProperties: false,
  };
  expect(toJsonSchema(fromJsonSchema(doc))).toEqual(doc);
});

test("annotations are carried, not enforced", async () => {
  // format in particular: validating it would mean shipping email/uri/date validators.
  await ok({ type: "string", format: "email", default: "a@b.c", title: "Email" }, "not-an-email");
});

test("$defs is inert rather than rejected, since it only matters via $ref", async () => {
  await ok({ type: "string", $defs: { unused: { type: "number" } } }, "hi");
});
