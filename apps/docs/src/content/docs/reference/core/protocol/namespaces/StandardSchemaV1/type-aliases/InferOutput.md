---
editUrl: false
next: false
prev: false
title: "InferOutput"
---

```ts
type InferOutput<T> = NonNullable<T["~standard"]["types"]>["output"];
```

Defined in: [packages/core/src/protocol/standard-schema.ts:53](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/standard-schema.ts#L53)

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/) |
