---
editUrl: false
next: false
prev: false
title: "toolCallCount"
---

```ts
function toolCallCount(expected): Scorer;
```

Defined in: [index.ts:590](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L590)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the number of `tool.call`s falls within `expected`, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `expected` | \| `number` \| \{ `max?`: `number`; `min?`: `number`; \} | an exact count, or a `{ min?, max? }` range (inclusive; omitted bound is unbounded). |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `toolCalls:{expected}`.

## Remarks

Catches efficiency regressions (a model that fans out redundant calls) and under-calling alike.
