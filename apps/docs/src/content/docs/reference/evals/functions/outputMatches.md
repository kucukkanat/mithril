---
editUrl: false
next: false
prev: false
title: "outputMatches"
---

```ts
function outputMatches(pattern): Scorer;
```

Defined in: [index.ts:558](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/index.ts#L558)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the assistant's final text matches `pattern`, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pattern` | `RegExp` | the RegExp to test against the joined final text. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `matches:{pattern.source}`.
