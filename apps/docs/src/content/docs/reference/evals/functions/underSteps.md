---
editUrl: false
next: false
prev: false
title: "underSteps"
---

```ts
function underSteps(maxSteps): Scorer;
```

Defined in: [index.ts:699](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L699)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the run used at most `maxSteps` steps, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maxSteps` | `number` | the step ceiling, read from the run's final usage. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `underSteps:{maxSteps}`.
