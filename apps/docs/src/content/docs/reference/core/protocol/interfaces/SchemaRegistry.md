---
editUrl: false
next: false
prev: false
title: "SchemaRegistry"
---

Defined in: [packages/core/src/protocol/suspension.ts:124](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/suspension.ts#L124)

Resolves a `resolutionSchemaId` to its Standard Schema for validating a resume resolution.

## Properties

### ids

```ts
readonly ids: readonly string[];
```

Defined in: [packages/core/src/protocol/suspension.ts:126](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/suspension.ts#L126)

## Methods

### get()

```ts
get(id): 
  | StandardSchemaV1<unknown, JsonValue>
  | undefined;
```

Defined in: [packages/core/src/protocol/suspension.ts:125](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/suspension.ts#L125)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

  \| [`StandardSchemaV1`](/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/)\>
  \| `undefined`
