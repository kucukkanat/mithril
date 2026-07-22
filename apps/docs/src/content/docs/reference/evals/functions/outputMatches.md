---
editUrl: false
next: false
prev: false
title: "outputMatches"
---

```ts
function outputMatches(pattern): Scorer;
```

Defined in: [index.ts:558](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L558)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the assistant's final text matches `pattern`, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pattern` | `RegExp` | the RegExp to test against the joined final text. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `matches:{pattern.source}`.
