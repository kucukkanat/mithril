---
editUrl: false
next: false
prev: false
title: "calledTool"
---

```ts
function calledTool(name): Scorer;
```

Defined in: index.ts:323

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` if the trajectory contains a `tool.call` event for `name`, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The tool name to look for in the event log. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

A [Scorer](/reference/evals/type-aliases/scorer/) named `called:{name}`.
