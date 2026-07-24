---
editUrl: false
next: false
prev: false
title: "addUsage"
---

```ts
function addUsage(totals, delta): UsageTotals;
```

Defined in: [packages/core/src/protocol/primitives.ts:90](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/primitives.ts#L90)

Immutably sum a totals accumulator and a per-event delta.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `totals` | [`UsageTotals`](/mithril/reference/core/protocol/interfaces/usagetotals/) | The running accumulator. |
| `delta` | [`UsageDelta`](/mithril/reference/core/protocol/interfaces/usagedelta/) | The per-event usage to fold in. |

## Returns

[`UsageTotals`](/mithril/reference/core/protocol/interfaces/usagetotals/)

A new [UsageTotals](/mithril/reference/core/protocol/interfaces/usagetotals/); `steps` is carried from `totals`, not summed.
