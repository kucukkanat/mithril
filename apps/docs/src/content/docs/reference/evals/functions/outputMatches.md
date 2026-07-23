---
editUrl: false
next: false
prev: false
title: "outputMatches"
---

```ts
function outputMatches(pattern): Scorer;
```

Defined in: [index.ts:594](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L594)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the assistant's final text matches `pattern`, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pattern` | `RegExp` | the RegExp to test against the joined final text. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `matches:{pattern.source}`.
