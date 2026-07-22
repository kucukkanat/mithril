---
editUrl: false
next: false
prev: false
title: "underSteps"
---

```ts
function underSteps(maxSteps): Scorer;
```

Defined in: [index.ts:663](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/index.ts#L663)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the run used at most `maxSteps` steps, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maxSteps` | `number` | the step ceiling, read from the run's final usage. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `underSteps:{maxSteps}`.
