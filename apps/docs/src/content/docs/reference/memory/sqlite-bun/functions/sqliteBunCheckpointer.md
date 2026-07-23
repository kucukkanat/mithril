---
editUrl: false
next: false
prev: false
title: "sqliteBunCheckpointer"
---

```ts
function sqliteBunCheckpointer(pathOrOpts?): Checkpointer;
```

Defined in: [sqlite-bun.ts:44](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/memory/src/sqlite-bun.ts#L44)

Creates a durable Checkpointer backed by `bun:sqlite` (Bun runtime only).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pathOrOpts?` | \| `string` \| \{ `path?`: `string`; \} | the SQLite database file path, or `{ path }`. Defaults to `":memory:"` (process-lifetime only); pass a file path for persistence across restarts. |

## Returns

`Checkpointer`

A Checkpointer with the same semantics as memoryCheckpointer, persisted to SQLite.

## Remarks

The `checkpoints` table is created on construction if absent, with `UNIQUE(run_id, checkpoint_id)` so
`put` is idempotent via `INSERT OR IGNORE`; `ifParent` optimistic-concurrency conflicts are detected
before insert and short-circuit with `"conflict"`. Tokens are bound as opaque parameters, never
interpolated. Passes checkpointerConformance.

## Example

```ts
const cp = sqliteBunCheckpointer("./runs.db"); // durable across restarts
await cp.put({ runId: "r1", checkpointId: "c1", parentId: null, token: "…", status: "suspended", createdAt: new Date().toISOString() });
```
