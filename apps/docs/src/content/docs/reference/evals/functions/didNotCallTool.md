---
editUrl: false
next: false
prev: false
title: "didNotCallTool"
---

```ts
function didNotCallTool(name): Scorer;
```

Defined in: [index.ts:607](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L607)

A restraint [Scorer](/reference/evals/type-aliases/scorer/): scores `1` when the run did **not** call `name`, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | the tool that should not have been called. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `abstained:{name}`.

## Remarks

The dominant small-model failure in the wild is keyword-tripping — calling a tool on any
mention of its topic. Score abstention separately from call accuracy: an agent that correctly does
nothing is a pass here.
