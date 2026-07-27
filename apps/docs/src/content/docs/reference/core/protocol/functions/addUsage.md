---
editUrl: false
next: false
prev: false
title: "addUsage"
---

```ts
function addUsage(totals, delta): UsageTotals;
```

Defined in: [packages/core/src/protocol/primitives.ts:90](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/primitives.ts#L90)

Immutably sum a totals accumulator and a per-event delta.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `totals` | [`UsageTotals`](/mithril/reference/core/protocol/interfaces/usagetotals/) | The running accumulator. |
| `delta` | [`UsageDelta`](/mithril/reference/core/protocol/interfaces/usagedelta/) | The per-event usage to fold in. |

## Returns

[`UsageTotals`](/mithril/reference/core/protocol/interfaces/usagetotals/)

A new [UsageTotals](/mithril/reference/core/protocol/interfaces/usagetotals/); `steps` is carried from `totals`, not summed.
