---
editUrl: false
next: false
prev: false
title: "fromJsonSchema"
---

```ts
function fromJsonSchema(doc, opts?): StandardSchemaV1<unknown, JsonValue>;
```

Defined in: [packages/core/src/protocol/json-schema.ts:446](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/json-schema.ts#L446)

Compile a JSON Schema (draft 2020-12 subset) into a [StandardSchemaV1](/mithril/reference/core/protocol/interfaces/standardschemav1/) validator.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `doc` | [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | the JSON Schema document. A boolean schema (`true`/`false`) is accepted. |
| `opts?` | [`FromJsonSchemaOptions`](/mithril/reference/core/protocol/interfaces/fromjsonschemaoptions/) | see [FromJsonSchemaOptions](/mithril/reference/core/protocol/interfaces/fromjsonschemaoptions/). |

## Returns

[`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)\>

a self-describing Standard Schema: [toJsonSchema](/mithril/reference/core/protocol/functions/tojsonschema/) recovers `doc` unchanged, so a tool
built this way both validates locally *and* advertises real parameters to the model.

## Throws

[UnsupportedJsonSchemaError](/mithril/reference/core/protocol/classes/unsupportedjsonschemaerror/) at construction — never at validate time — for a keyword
outside the subset, a malformed subschema, or an invalid `pattern`.

## Remarks

The inverse of [toJsonSchema](/mithril/reference/core/protocol/functions/tojsonschema/), and the piece a runtime-defined tool needs: a model emits JSON
Schema, and the tool built from it must validate its own input. Zero-dependency, so core stays
validator-free.

**Enforced:** `type` (including unions like `["string","null"]`; `integer` matches whole numbers and
`number` matches both), `properties`, `required`, `additionalProperties`, `items`, `minItems`,
`maxItems`, `enum`, `const`, `anyOf`, `minLength`, `maxLength`, `pattern`, `minimum`, `maximum`,
`exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`. An empty schema (`{}`) accepts anything.

**Carried but not enforced:** `title`, `description`, `default`, `examples`, `format`, and the other
annotations. `format` is deliberately not validated and `default` is deliberately not injected — this
is a validator, not a coercer.

**Rejected:** `$ref`, `$dynamicRef`, `oneOf`, `allOf`, `not`, `if`/`then`/`else`, `patternProperties`,
`propertyNames`, `dependentSchemas`, `dependentRequired`, `prefixItems`, `contains`, `uniqueItems`,
`minProperties`, `maxProperties`, `unevaluatedProperties`, `unevaluatedItems`. `oneOf` is refused
rather than aliased to `anyOf`: exactly-one-match is a different assertion, and quietly widening it
would let invalid input through a schema that looks like it forbids it. `$defs`/`definitions` are
inert (they only matter via `$ref`, which is rejected).

Issue messages are prefixed with the dotted instance path (`user.0.id: expected string, got number`)
because the loop's `INVALID_TOOL_INPUT` error joins issue *messages* only — a path carried solely in
`issue.path` would never reach the model.

## Example

```ts
import { fromJsonSchema, toJsonSchema } from "@mithril/core/protocol";

const schema = fromJsonSchema({
  type: "object",
  properties: { city: { type: "string" }, days: { type: "integer", minimum: 1 } },
  required: ["city"],
  additionalProperties: false,
});

await schema["~standard"].validate({ city: "NYC", days: 3 }); // { value: … }
await schema["~standard"].validate({ days: 0 });              // { issues: [ …missing "city"…, …>= 1… ] }
```
