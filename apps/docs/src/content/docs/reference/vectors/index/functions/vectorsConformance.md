---
editUrl: false
next: false
prev: false
title: "vectorsConformance"
---

```ts
function vectorsConformance(make, t): void;
```

Defined in: [index.ts:150](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/vectors/src/index.ts#L150)

Shared conformance suite every [VectorStore](/mithril/reference/vectors/index/interfaces/vectorstore/) implementation must pass.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `make` | () => `Promise`\<[`VectorStore`](/mithril/reference/vectors/index/interfaces/vectorstore/)\> | Factory producing a fresh, empty [VectorStore](/mithril/reference/vectors/index/interfaces/vectorstore/) for each case. |
| `t` | [`VectorsTestAdapter`](/mithril/reference/vectors/index/interfaces/vectorstestadapter/) | A [VectorsTestAdapter](/mithril/reference/vectors/index/interfaces/vectorstestadapter/) bridging the suite to a host test runner. |

## Returns

`void`

## Remarks

Covers upsert/size, nearest-neighbour ordering, `topK` truncation, metadata filtering, upsert
replacement, and delete.

## Example

```ts
import { test, expect } from "bun:test";
vectorsConformance(async () => memoryVectorStore(), {
  test,
  assertEqual: (a, b) => expect(a).toEqual(b),
  assertTrue: (v) => expect(v).toBe(true),
});
```
