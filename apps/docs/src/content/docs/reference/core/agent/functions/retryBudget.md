---
editUrl: false
next: false
prev: false
title: "retryBudget"
---

```ts
function retryBudget<Deps>(opts?): Middleware<Deps>;
```

Defined in: [packages/core/src/agent/healing.ts:212](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/healing.ts#L212)

Step-altitude repair budget: a tool that keeps failing is re-asked (each failure emits `tool.retry`)
until it exhausts `max` consecutive failures with no success in between, at which point the run halts
with a clear `ToolRepairExhausted` terminal error instead of burning to `maxSteps`. Any success resets
that tool's counter.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`RetryBudgetOptions`](/mithril/reference/core/agent/interfaces/retrybudgetoptions/) | see [RetryBudgetOptions](/mithril/reference/core/agent/interfaces/retrybudgetoptions/). `max` defaults to 2; `max: 0` gives up on the first failure. |

## Returns

[`Middleware`](/mithril/reference/core/protocol/interfaces/middleware/)\<`Deps`\>
