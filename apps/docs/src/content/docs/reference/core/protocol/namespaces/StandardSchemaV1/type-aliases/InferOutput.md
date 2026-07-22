---
editUrl: false
next: false
prev: false
title: "InferOutput"
---

```ts
type InferOutput<T> = NonNullable<T["~standard"]["types"]>["output"];
```

Defined in: [packages/core/src/protocol/standard-schema.ts:53](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/standard-schema.ts#L53)

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`StandardSchemaV1`](/reference/core/protocol/interfaces/standardschemav1/) |
