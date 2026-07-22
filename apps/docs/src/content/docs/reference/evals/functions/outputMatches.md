---
editUrl: false
next: false
prev: false
title: "outputMatches"
---

```ts
function outputMatches(pattern): Scorer;
```

Defined in: [index.ts:558](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L558)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the assistant's final text matches `pattern`, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pattern` | `RegExp` | the RegExp to test against the joined final text. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `matches:{pattern.source}`.
