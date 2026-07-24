---
editUrl: false
next: false
prev: false
title: "indexedDbKv"
---

```ts
function indexedDbKv(opts?): KeyValue;
```

Defined in: [indexeddb.ts:34](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/kv/src/indexeddb.ts#L34)

Create a [KeyValue](/mithril/reference/kv/index/interfaces/keyvalue/) backed by the browser's IndexedDB.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts?` | \{ `dbName?`: `string`; `now?`: () => `number`; `storeName?`: `string`; \} | `dbName` (default `"mithril-kv"`) and `storeName` (default `"kv"`) name the database and object store; `now` injects the clock (default `Date.now`) for deterministic TTL in tests. |
| `opts.dbName?` | `string` | - |
| `opts.now?` | () => `number` | - |
| `opts.storeName?` | `string` | - |

## Returns

[`KeyValue`](/mithril/reference/kv/index/interfaces/keyvalue/)

A persistent, per-origin [KeyValue](/mithril/reference/kv/index/interfaces/keyvalue/).

## Remarks

**Browser-only** — requires the `indexedDB` global. Passes the same kvConformance suite
as memoryKv. Expiry is lazy: an expired entry is evicted the next time it is read.

## Example

```ts
const kv = indexedDbKv();
await kv.set("session", { token }, { ttlMs: 3_600_000 });
```
