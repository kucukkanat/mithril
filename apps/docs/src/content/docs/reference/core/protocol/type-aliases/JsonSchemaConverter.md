---
editUrl: false
next: false
prev: false
title: "JsonSchemaConverter"
---

```ts
type JsonSchemaConverter = (schema) => 
  | JsonSchema
  | undefined;
```

Defined in: [packages/core/src/protocol/json-schema.ts:25](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/json-schema.ts#L25)

A caller-supplied converter from a [StandardSchemaV1](/reference/core/protocol/interfaces/standardschemav1/) to a [JsonSchema](/reference/core/protocol/type-aliases/jsonschema/).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `schema` | [`StandardSchemaV1`](/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, `unknown`\> |

## Returns

  \| [`JsonSchema`](/reference/core/protocol/type-aliases/jsonschema/)
  \| `undefined`

## Remarks

Return `undefined` to defer to the next strategy. The canonical use is passing a validator's
own converter, e.g. `(s) => z.toJSONSchema(s as z.ZodType)` for Zod v4.
