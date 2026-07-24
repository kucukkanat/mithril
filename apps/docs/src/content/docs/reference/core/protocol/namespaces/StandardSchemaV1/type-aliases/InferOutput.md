---
editUrl: false
next: false
prev: false
title: "InferOutput"
---

```ts
type InferOutput<T> = NonNullable<T["~standard"]["types"]>["output"];
```

Defined in: [packages/core/src/protocol/standard-schema.ts:53](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/standard-schema.ts#L53)

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`StandardSchemaV1`](/reference/core/protocol/interfaces/standardschemav1/) |
