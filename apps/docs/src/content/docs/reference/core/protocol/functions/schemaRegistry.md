---
editUrl: false
next: false
prev: false
title: "schemaRegistry"
---

```ts
function schemaRegistry(entries): SchemaRegistry;
```

Defined in: [packages/core/src/protocol/suspension.ts:135](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/suspension.ts#L135)

Build a [SchemaRegistry](/reference/core/protocol/interfaces/schemaregistry/) from an id → schema map.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entries` | `Readonly`\<`Record`\<`string`, [`StandardSchemaV1`](/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/)\>\>\> | The `resolutionSchemaId` → validator entries. |

## Returns

[`SchemaRegistry`](/reference/core/protocol/interfaces/schemaregistry/)

A registry exposing `get(id)` and the known `ids`.
