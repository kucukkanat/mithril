---
editUrl: false
next: false
prev: false
title: "toJsonSchema"
---

```ts
function toJsonSchema(schema, convert?): JsonValue;
```

Defined in: [packages/core/src/protocol/json-schema.ts:62](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/json-schema.ts#L62)

Convert a [StandardSchemaV1](/mithril/reference/core/protocol/interfaces/standardschemav1/) to a JSON Schema for provider tool-parameter definitions.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, `unknown`\> | the tool's input schema. |
| `convert?` | [`JsonSchemaConverter`](/mithril/reference/core/protocol/type-aliases/jsonschemaconverter/) | an optional validator-specific converter, tried first (e.g. Zod v4's `z.toJSONSchema`). |

## Returns

[`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)

the derived JSON Schema, or [PERMISSIVE\_OBJECT](/mithril/reference/core/protocol/variables/permissive_object/) when the schema can't be described.

## Remarks

Standard Schema exposes no structural introspection, so this recovers a schema from a caller
converter, a self-describing schema (see [withJsonSchema](/mithril/reference/core/protocol/functions/withjsonschema/)), or the permissive fallback — never by
guessing shape from the validator. Attach a schema explicitly with [withJsonSchema](/mithril/reference/core/protocol/functions/withjsonschema/) for a
dependency-free path.

## Example

```ts
import { toJsonSchema } from "@mithril/core/protocol";
import { z } from "zod";

const params = toJsonSchema(z.object({ city: z.string() }), (s) => z.toJSONSchema(s as z.ZodType));
```
