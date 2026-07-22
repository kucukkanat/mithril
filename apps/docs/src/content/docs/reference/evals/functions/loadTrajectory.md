---
editUrl: false
next: false
prev: false
title: "loadTrajectory"
---

```ts
function loadTrajectory(json): Trajectory;
```

Defined in: [index.ts:241](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L241)

Parse a [serializeTrajectory](/reference/evals/functions/serializetrajectory/) string back into a [Trajectory](/reference/evals/interfaces/trajectory/), deriving `final` via `replay`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `json` | `string` |

## Returns

[`Trajectory`](/reference/evals/interfaces/trajectory/)
