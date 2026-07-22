---
editUrl: false
next: false
prev: false
title: "underCost"
---

```ts
function underCost(maxMicroUsd): Scorer;
```

Defined in: [index.ts:650](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/index.ts#L650)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the run's total cost is at or under `maxMicroUsd` micro-USD, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maxMicroUsd` | `number` | the cost ceiling in micro-USD (1e-6 USD), read from the run's final usage. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `underCost:{maxMicroUsd}`.
