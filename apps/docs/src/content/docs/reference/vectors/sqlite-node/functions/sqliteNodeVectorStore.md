---
editUrl: false
next: false
prev: false
title: "sqliteNodeVectorStore"
---

```ts
function sqliteNodeVectorStore(pathOrOpts?): VectorStore;
```

Defined in: [sqlite-node.ts:36](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/vectors/src/sqlite-node.ts#L36)

Create a durable [VectorStore](/mithril/reference/vectors/index/interfaces/vectorstore/) backed by `node:sqlite` (Node >= 22.5, no native dependency).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pathOrOpts?` | \| `string` \| \{ `path?`: `string`; \} | the SQLite file path, or `{ path }`; defaults to `":memory:"` (process-lifetime). Pass a file path to persist across restarts. |

## Returns

[`VectorStore`](/mithril/reference/vectors/index/interfaces/vectorstore/)

a [VectorStore](/mithril/reference/vectors/index/interfaces/vectorstore/) with the same semantics as `memoryVectorStore`, persisted to SQLite.

## Remarks

The Node counterpart of `sqliteBunVectorStore` — same schema, idempotent `upsert` via
`ON CONFLICT(id) DO UPDATE`, and an **exact** brute-force cosine scan (not ANN). Passes `vectorsConformance`.

## Example

```ts
import { sqliteNodeVectorStore } from "@mithril/vectors/sqlite-node";

const store = sqliteNodeVectorStore("./embeddings.db"); // durable across restarts, on Node
```
