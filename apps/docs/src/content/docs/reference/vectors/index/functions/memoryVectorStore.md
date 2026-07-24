---
editUrl: false
next: false
prev: false
title: "memoryVectorStore"
---

```ts
function memoryVectorStore(): VectorStore;
```

Defined in: [index.ts:96](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L96)

Create an in-memory [VectorStore](/mithril/reference/vectors/index/interfaces/vectorstore/) that answers queries with an exact brute-force cosine scan.

## Returns

[`VectorStore`](/mithril/reference/vectors/index/interfaces/vectorstore/)

A fresh, browser-capable store with no shared state.

## Remarks

The reference implementation for [vectorsConformance](/mithril/reference/vectors/index/functions/vectorsconformance/). Exact (not approximate) — every
query scans all records, which is ideal for small collections and for tests; swap in an ANN-indexed
backend for large corpora. Vectors are copied into `Float32Array` on upsert.

## Example

```ts
const store = memoryVectorStore();
await store.upsert([{ id: "a", vector: [1, 0, 0], metadata: { doc: "intro" } }]);
const [top] = await store.query([0.9, 0.1, 0], { topK: 1 });
```
