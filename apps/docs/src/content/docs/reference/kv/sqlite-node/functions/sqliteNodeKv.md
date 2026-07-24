---
editUrl: false
next: false
prev: false
title: "sqliteNodeKv"
---

```ts
function sqliteNodeKv(opts?): KeyValue;
```

Defined in: [sqlite-node.ts:29](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/kv/src/sqlite-node.ts#L29)

Creates a durable [KeyValue](/reference/kv/index/interfaces/keyvalue/) store backed by `node:sqlite` (Node >= 22.5, no native dependency).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts?` | \{ `now?`: () => `number`; `path?`: `string`; \} | `path` (SQLite file; defaults to `":memory:"`) and `now` (clock injection for deterministic TTL in tests; defaults to `Date.now`). |
| `opts.now?` | () => `number` | - |
| `opts.path?` | `string` | - |

## Returns

[`KeyValue`](/reference/kv/index/interfaces/keyvalue/)

A [KeyValue](/reference/kv/index/interfaces/keyvalue/) persisted to SQLite, with the same TTL semantics as memoryKv.

## Remarks

The server-durable counterpart to the browser-only IndexedDB backend. Values are JSON-serialized;
expiry is lazy (an entry is evicted the next time it is read after its expiry). Passes `kvConformance`.

## Example

```ts
import { sqliteNodeKv } from "@mithril/kv/sqlite-node";

const kv = sqliteNodeKv({ path: "./cache.db" });
await kv.set("user:1", { name: "Ada" }, { ttlMs: 60_000 });
```
