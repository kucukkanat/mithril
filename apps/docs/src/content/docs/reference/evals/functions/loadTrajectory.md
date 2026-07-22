---
editUrl: false
next: false
prev: false
title: "loadTrajectory"
---

```ts
function loadTrajectory(json): Trajectory;
```

Defined in: [index.ts:241](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/index.ts#L241)

Parse a [serializeTrajectory](/reference/evals/functions/serializetrajectory/) string back into a [Trajectory](/reference/evals/interfaces/trajectory/), deriving `final` via `replay`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `json` | `string` |

## Returns

[`Trajectory`](/reference/evals/interfaces/trajectory/)
