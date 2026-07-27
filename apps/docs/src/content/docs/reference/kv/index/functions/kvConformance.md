---
editUrl: false
next: false
prev: false
title: "kvConformance"
---

```ts
function kvConformance(make, t): void;
```

Defined in: [index.ts:115](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/kv/src/index.ts#L115)

Shared conformance suite that every [KeyValue](/mithril/reference/kv/index/interfaces/keyvalue/) implementation must pass.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `make` | () => `Promise`\<[`KeyValue`](/mithril/reference/kv/index/interfaces/keyvalue/)\> | Factory producing a fresh, empty [KeyValue](/mithril/reference/kv/index/interfaces/keyvalue/) for each test case. |
| `t` | [`KvTestAdapter`](/mithril/reference/kv/index/interfaces/kvtestadapter/) | A [KvTestAdapter](/mithril/reference/kv/index/interfaces/kvtestadapter/) bridging the suite to a host test runner. |

## Returns

`void`

## Remarks

Covers get/set/has/delete roundtrip and TTL expiry. Call it to certify a backend such as
[memoryKv](/mithril/reference/kv/index/functions/memorykv/).

## Example

```ts
import { test, expect } from "bun:test";
kvConformance(async () => memoryKv(), { test, assertEqual: (a, b) => expect(a).toEqual(b) });
```
