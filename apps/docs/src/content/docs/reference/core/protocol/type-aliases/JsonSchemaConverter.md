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

Defined in: [packages/core/src/protocol/json-schema.ts:25](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/json-schema.ts#L25)

A caller-supplied converter from a [StandardSchemaV1](/mithril/reference/core/protocol/interfaces/standardschemav1/) to a [JsonSchema](/mithril/reference/core/protocol/type-aliases/jsonschema/).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `schema` | [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, `unknown`\> |

## Returns

  \| [`JsonSchema`](/mithril/reference/core/protocol/type-aliases/jsonschema/)
  \| `undefined`

## Remarks

Return `undefined` to defer to the next strategy. The canonical use is passing a validator's
own converter, e.g. `(s) => z.toJSONSchema(s as z.ZodType)` for Zod v4.
