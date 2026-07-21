---
editUrl: false
next: false
prev: false
title: "memoryCheckpointer"
---

```ts
function memoryCheckpointer(): Checkpointer;
```

Defined in: index.ts:33

Creates an in-memory Checkpointer — records are held in a `Map` keyed by run id and lost on
process exit.

## Returns

`Checkpointer`

A fresh Checkpointer with no shared state.

## Remarks

Works in every runtime and is the reference implementation the conformance kit
([checkpointerConformance](/reference/memory/index/functions/checkpointerconformance/)) is written against. `put` is idempotent on `checkpointId` and, when
`opts.ifParent` is supplied, guards optimistic concurrency by returning `"conflict"` if it does not match
the latest checkpoint. For durability across restarts use a persistent backend such as
sqliteBunCheckpointer.

## Example

```ts
const cp = memoryCheckpointer();
await cp.put({ runId: "r1", checkpointId: "c1", parentId: null, token: "…", status: "suspended", createdAt: new Date().toISOString() });
const latest = await cp.latest("r1"); // → the "c1" record
```
