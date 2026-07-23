---
editUrl: false
next: false
prev: false
title: "loadTrajectory"
---

```ts
function loadTrajectory(json): Trajectory;
```

Defined in: [index.ts:277](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L277)

Parse a [serializeTrajectory](/reference/evals/functions/serializetrajectory/) string back into a [Trajectory](/reference/evals/interfaces/trajectory/), deriving `final` via `replay`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `json` | `string` |

## Returns

[`Trajectory`](/reference/evals/interfaces/trajectory/)
