---
editUrl: false
next: false
prev: false
title: "calledInOrder"
---

```ts
function calledInOrder(names): Scorer;
```

Defined in: [index.ts:574](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L574)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the trajectory's `tool.call`s include `names` in the given relative
order (other calls may appear in between), else `0` — for asserting a tool *sequence*, not just presence.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `names` | readonly `string`[] | the tool names that must appear in this order. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `inOrder:{names}`.

## Example

```ts
// the agent must search before it books:
calledInOrder(["search_flights", "book_flight"]);
```
