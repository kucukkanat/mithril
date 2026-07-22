---
editUrl: false
next: false
prev: false
title: "underCost"
---

```ts
function underCost(maxMicroUsd): Scorer;
```

Defined in: [index.ts:622](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L622)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the run's total cost is at or under `maxMicroUsd` micro-USD, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maxMicroUsd` | `number` | the cost ceiling in micro-USD (1e-6 USD), read from the run's final usage. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `underCost:{maxMicroUsd}`.
