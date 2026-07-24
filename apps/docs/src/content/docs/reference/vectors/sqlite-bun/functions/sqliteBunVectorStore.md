---
editUrl: false
next: false
prev: false
title: "sqliteBunVectorStore"
---

```ts
function sqliteBunVectorStore(pathOrOpts?): VectorStore;
```

Defined in: [sqlite-bun.ts:40](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/sqlite-bun.ts#L40)

Create a durable [VectorStore](/mithril/reference/vectors/index/interfaces/vectorstore/) backed by `bun:sqlite` (Bun runtime only).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pathOrOpts?` | \| `string` \| \{ `path?`: `string`; \} | the SQLite file path, or `{ path }`; defaults to `":memory:"` (process-lifetime). Pass a file path to persist across restarts. |

## Returns

[`VectorStore`](/mithril/reference/vectors/index/interfaces/vectorstore/)

a [VectorStore](/mithril/reference/vectors/index/interfaces/vectorstore/) with the same semantics as `memoryVectorStore`, persisted to SQLite.

## Remarks

The `vectors` table is created on construction. `upsert` is idempotent via
`ON CONFLICT(id) DO UPDATE`. Ranking is an **exact** brute-force cosine scan over all rows (not ANN) — ideal
up to tens of thousands of vectors; beyond that, move to an ANN-indexed backend behind the same interface.
Vectors and metadata are bound as JSON parameters, never interpolated. Passes `vectorsConformance`.

## Example

```ts
import { sqliteBunVectorStore } from "@mithril/vectors/sqlite-bun";

const store = sqliteBunVectorStore("./embeddings.db"); // durable across restarts
await store.upsert([{ id: "doc-1", vector: embedding, metadata: { source: "faq" } }]);
```
