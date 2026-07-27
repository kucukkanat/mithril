---
editUrl: false
next: false
prev: false
title: "SchemaRegistry"
---

Defined in: [packages/core/src/protocol/suspension.ts:124](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/suspension.ts#L124)

Resolves a `resolutionSchemaId` to its Standard Schema for validating a resume resolution.

## Properties

### ids

```ts
readonly ids: readonly string[];
```

Defined in: [packages/core/src/protocol/suspension.ts:126](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/suspension.ts#L126)

## Methods

### get()

```ts
get(id): 
  | StandardSchemaV1<unknown, JsonValue>
  | undefined;
```

Defined in: [packages/core/src/protocol/suspension.ts:125](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/suspension.ts#L125)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

  \| [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)\>
  \| `undefined`
