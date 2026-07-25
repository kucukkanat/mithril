---
editUrl: false
next: false
prev: false
title: "SchemaRegistry"
---

Defined in: [packages/core/src/protocol/suspension.ts:124](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/suspension.ts#L124)

Resolves a `resolutionSchemaId` to its Standard Schema for validating a resume resolution.

## Properties

### ids

```ts
readonly ids: readonly string[];
```

Defined in: [packages/core/src/protocol/suspension.ts:126](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/suspension.ts#L126)

## Methods

### get()

```ts
get(id): 
  | StandardSchemaV1<unknown, JsonValue>
  | undefined;
```

Defined in: [packages/core/src/protocol/suspension.ts:125](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/suspension.ts#L125)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

  \| [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)\>
  \| `undefined`
