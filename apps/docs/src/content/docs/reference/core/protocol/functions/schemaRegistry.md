---
editUrl: false
next: false
prev: false
title: "schemaRegistry"
---

```ts
function schemaRegistry(entries): SchemaRegistry;
```

Defined in: [packages/core/src/protocol/suspension.ts:135](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/suspension.ts#L135)

Build a [SchemaRegistry](/mithril/reference/core/protocol/interfaces/schemaregistry/) from an id → schema map.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entries` | `Readonly`\<`Record`\<`string`, [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)\>\>\> | The `resolutionSchemaId` → validator entries. |

## Returns

[`SchemaRegistry`](/mithril/reference/core/protocol/interfaces/schemaregistry/)

A registry exposing `get(id)` and the known `ids`.
