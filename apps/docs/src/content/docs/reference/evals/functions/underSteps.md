---
editUrl: false
next: false
prev: false
title: "underSteps"
---

```ts
function underSteps(maxSteps): Scorer;
```

Defined in: [index.ts:635](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L635)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the run used at most `maxSteps` steps, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maxSteps` | `number` | the step ceiling, read from the run's final usage. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `underSteps:{maxSteps}`.
