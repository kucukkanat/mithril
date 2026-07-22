---
editUrl: false
next: false
prev: false
title: "InferInput"
---

```ts
type InferInput<T> = NonNullable<T["~standard"]["types"]>["input"];
```

Defined in: [packages/core/src/protocol/standard-schema.ts:52](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/standard-schema.ts#L52)

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`StandardSchemaV1`](/reference/core/protocol/interfaces/standardschemav1/) |
