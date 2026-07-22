---
editUrl: false
next: false
prev: false
title: "underCost"
---

```ts
function underCost(maxMicroUsd): Scorer;
```

Defined in: [index.ts:622](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L622)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the run's total cost is at or under `maxMicroUsd` micro-USD, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maxMicroUsd` | `number` | the cost ceiling in micro-USD (1e-6 USD), read from the run's final usage. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `underCost:{maxMicroUsd}`.
