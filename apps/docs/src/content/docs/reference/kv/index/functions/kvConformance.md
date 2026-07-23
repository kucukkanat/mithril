---
editUrl: false
next: false
prev: false
title: "kvConformance"
---

```ts
function kvConformance(make, t): void;
```

Defined in: [index.ts:115](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/kv/src/index.ts#L115)

Shared conformance suite that every [KeyValue](/reference/kv/index/interfaces/keyvalue/) implementation must pass.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `make` | () => `Promise`\<[`KeyValue`](/reference/kv/index/interfaces/keyvalue/)\> | Factory producing a fresh, empty [KeyValue](/reference/kv/index/interfaces/keyvalue/) for each test case. |
| `t` | [`KvTestAdapter`](/reference/kv/index/interfaces/kvtestadapter/) | A [KvTestAdapter](/reference/kv/index/interfaces/kvtestadapter/) bridging the suite to a host test runner. |

## Returns

`void`

## Remarks

Covers get/set/has/delete roundtrip and TTL expiry. Call it to certify a backend such as
[memoryKv](/reference/kv/index/functions/memorykv/).

## Example

```ts
import { test, expect } from "bun:test";
kvConformance(async () => memoryKv(), { test, assertEqual: (a, b) => expect(a).toEqual(b) });
```
