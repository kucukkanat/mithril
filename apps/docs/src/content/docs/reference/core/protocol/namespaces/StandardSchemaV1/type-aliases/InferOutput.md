---
editUrl: false
next: false
prev: false
title: "InferOutput"
---

```ts
type InferOutput<T> = NonNullable<T["~standard"]["types"]>["output"];
```

Defined in: [packages/core/src/protocol/standard-schema.ts:53](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/standard-schema.ts#L53)

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/) |
