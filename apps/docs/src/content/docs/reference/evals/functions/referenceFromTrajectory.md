---
editUrl: false
next: false
prev: false
title: "referenceFromTrajectory"
---

```ts
function referenceFromTrajectory(t): ReferenceTrajectory;
```

Defined in: trajectory.ts:188

Derive a [ReferenceTrajectory](/reference/evals/type-aliases/referencetrajectory/) from a recorded [Trajectory](/reference/evals/interfaces/trajectory/) — its ordered `tool.call`s as
`{ tool, input }` steps. Turns a known-good run into a golden to feed [matchesTrajectory](/reference/evals/functions/matchestrajectory/).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `t` | [`Trajectory`](/reference/evals/interfaces/trajectory/) | a recorded trajectory (from [runEval](/reference/evals/functions/runeval/), [loadTrajectory](/reference/evals/functions/loadtrajectory/), or a live run). |

## Returns

[`ReferenceTrajectory`](/reference/evals/type-aliases/referencetrajectory/)

the extracted reference sequence.
