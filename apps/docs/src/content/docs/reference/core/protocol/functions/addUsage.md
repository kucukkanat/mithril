---
editUrl: false
next: false
prev: false
title: "addUsage"
---

```ts
function addUsage(totals, delta): UsageTotals;
```

Defined in: [packages/core/src/protocol/primitives.ts:90](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/primitives.ts#L90)

Immutably sum a totals accumulator and a per-event delta.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `totals` | [`UsageTotals`](/reference/core/protocol/interfaces/usagetotals/) | The running accumulator. |
| `delta` | [`UsageDelta`](/reference/core/protocol/interfaces/usagedelta/) | The per-event usage to fold in. |

## Returns

[`UsageTotals`](/reference/core/protocol/interfaces/usagetotals/)

A new [UsageTotals](/reference/core/protocol/interfaces/usagetotals/); `steps` is carried from `totals`, not summed.
