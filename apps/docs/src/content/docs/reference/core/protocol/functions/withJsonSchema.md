---
editUrl: false
next: false
prev: false
title: "withJsonSchema"
---

```ts
function withJsonSchema<In, Out>(schema, jsonSchema): StandardSchemaV1<In, Out>;
```

Defined in: [packages/core/src/protocol/json-schema.ts:91](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/json-schema.ts#L91)

Attach an explicit JSON Schema to a Standard Schema so [toJsonSchema](/mithril/reference/core/protocol/functions/tojsonschema/) recovers it with no converter.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `In` | the schema's input type. |
| `Out` | the schema's validated output type. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/)\<`In`, `Out`\> | any Standard Schema (its `~standard` validator is preserved unchanged). |
| `jsonSchema` | [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | the JSON Schema to expose for provider tool definitions. |

## Returns

[`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/)\<`In`, `Out`\>

the same schema with a `jsonSchema` property carrying `jsonSchema`.

## Remarks

The dependency-free path to typed tool parameters: validate with any validator, describe with a
hand-written or generated JSON Schema.

## Example

```ts
import { withJsonSchema } from "@mithril/core/protocol";

const citySchema = withJsonSchema(myValidator, {
  type: "object",
  properties: { city: { type: "string" } },
  required: ["city"],
});
```
