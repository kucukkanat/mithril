---
editUrl: false
next: false
prev: false
title: "underSteps"
---

```ts
function underSteps(maxSteps): Scorer;
```

Defined in: [index.ts:635](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L635)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the run used at most `maxSteps` steps, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maxSteps` | `number` | the step ceiling, read from the run's final usage. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `underSteps:{maxSteps}`.
