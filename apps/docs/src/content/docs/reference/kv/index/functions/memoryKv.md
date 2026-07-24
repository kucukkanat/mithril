---
editUrl: false
next: false
prev: false
title: "memoryKv"
---

```ts
function memoryKv(now?): KeyValue;
```

Defined in: [index.ts:62](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/kv/src/index.ts#L62)

Creates an in-memory [KeyValue](/mithril/reference/kv/index/interfaces/keyvalue/) store backed by a `Map`, with lazy TTL expiry on read.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `now` | () => `number` | `Date.now` | Clock injection returning the current epoch-ms; defaults to `Date.now`. Override it to drive TTL deterministically in tests. |

## Returns

[`KeyValue`](/mithril/reference/kv/index/interfaces/keyvalue/)

A fresh [KeyValue](/mithril/reference/kv/index/interfaces/keyvalue/) with no shared state.

## Remarks

Works in every runtime and is the reference implementation for [kvConformance](/mithril/reference/kv/index/functions/kvconformance/). Expiry is lazy:
an expired entry is evicted the next time it is read via `get`/`has`, not on a timer.

## Example

```ts
const kv = memoryKv();
await kv.set("user:1", { name: "Ada" }, { ttlMs: 60_000 });
await kv.get<{ name: string }>("user:1"); // → { name: "Ada" } (until it expires)
```
