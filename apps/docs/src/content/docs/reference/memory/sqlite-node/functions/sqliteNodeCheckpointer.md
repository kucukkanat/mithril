---
editUrl: false
next: false
prev: false
title: "sqliteNodeCheckpointer"
---

```ts
function sqliteNodeCheckpointer(pathOrOpts?): Checkpointer;
```

Defined in: [sqlite-node.ts:44](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/memory/src/sqlite-node.ts#L44)

Creates a durable Checkpointer backed by `node:sqlite` (Node >= 22.5, no native dependency).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pathOrOpts?` | \| `string` \| \{ `path?`: `string`; \} | the SQLite database file path, or `{ path }`. Defaults to `":memory:"` (process-lifetime only); pass a file path for persistence across restarts. |

## Returns

`Checkpointer`

A Checkpointer with the same semantics as memoryCheckpointer, persisted to SQLite.

## Remarks

The Node counterpart of `sqliteBunCheckpointer` — identical schema, idempotent `put` via `INSERT OR IGNORE`,
and `ifParent` optimistic-concurrency conflicts short-circuiting with `"conflict"`. Tokens are bound as
opaque parameters, never interpolated. Passes `checkpointerConformance`.

## Example

```ts
import { sqliteNodeCheckpointer } from "@mithril/memory/sqlite-node";

const cp = sqliteNodeCheckpointer("./runs.db"); // durable across restarts, on Node
```
