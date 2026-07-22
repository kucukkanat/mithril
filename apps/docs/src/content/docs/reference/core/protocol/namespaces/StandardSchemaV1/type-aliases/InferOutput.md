---
editUrl: false
next: false
prev: false
title: "InferOutput"
---

```ts
type InferOutput<T> = NonNullable<T["~standard"]["types"]>["output"];
```

Defined in: [packages/core/src/protocol/standard-schema.ts:53](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/standard-schema.ts#L53)

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`StandardSchemaV1`](/reference/core/protocol/interfaces/standardschemav1/) |
