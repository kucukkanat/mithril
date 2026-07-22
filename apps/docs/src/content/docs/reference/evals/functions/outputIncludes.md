---
editUrl: false
next: false
prev: false
title: "outputIncludes"
---

```ts
function outputIncludes(substring, opts?): Scorer;
```

Defined in: [index.ts:544](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L544)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the assistant's final text contains `substring`, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `substring` | `string` | the text to look for; matched case-sensitively unless `ignoreCase` is set. |
| `opts?` | \{ `ignoreCase?`: `boolean`; \} | `{ ignoreCase }` to compare case-insensitively. |
| `opts.ignoreCase?` | `boolean` | - |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `includes:{substring}`.
