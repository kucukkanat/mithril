---
editUrl: false
next: false
prev: false
title: "calledTool"
---

```ts
function calledTool(name): Scorer;
```

Defined in: [index.ts:519](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L519)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the trajectory contains a `tool.call` event for `name`, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The tool name to look for in the event log. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

A [Scorer](/reference/evals/type-aliases/scorer/) named `called:{name}`.
