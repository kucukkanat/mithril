---
editUrl: false
next: false
prev: false
title: "SchemaRegistry"
---

Defined in: packages/core/src/protocol/suspension.ts:119

Resolves a `resolutionSchemaId` to its Standard Schema for validating a resume resolution.

## Properties

### ids

```ts
readonly ids: readonly string[];
```

Defined in: packages/core/src/protocol/suspension.ts:121

## Methods

### get()

```ts
get(id): 
  | StandardSchemaV1<unknown, JsonValue>
  | undefined;
```

Defined in: packages/core/src/protocol/suspension.ts:120

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

  \| [`StandardSchemaV1`](/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/)\>
  \| `undefined`
