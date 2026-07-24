---
editUrl: false
next: false
prev: false
title: "checkpointerConformance"
---

```ts
function checkpointerConformance(make, t): void;
```

Defined in: [index.ts:85](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/memory/src/index.ts#L85)

Shared conformance suite (§10) that every Checkpointer implementation must pass.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `make` | () => `Promise`\<`Checkpointer`\> | Factory producing a fresh, empty Checkpointer for each test case. |
| `t` | `TestAdapter` | A TestAdapter bridging the suite to a host test runner (bun:test / vitest). |

## Returns

`void`

## Remarks

Registers cases covering roundtrip + `latest`, insertion-order `history`, `ifParent` optimistic-concurrency
guarding, `put` idempotency on `checkpointId`, and `purge`. Call it from a test file to certify a backend
such as [memoryCheckpointer](/mithril/reference/memory/index/functions/memorycheckpointer/) or sqliteBunCheckpointer.

## Example

```ts
import { test } from "bun:test";
checkpointerConformance(async () => memoryCheckpointer(), {
  test,
  assertEqual: (a, b) => expect(a).toEqual(b),
});
```
