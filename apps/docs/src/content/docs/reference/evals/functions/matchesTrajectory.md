---
editUrl: false
next: false
prev: false
title: "matchesTrajectory"
---

```ts
function matchesTrajectory(reference, opts?): Scorer;
```

Defined in: trajectory.ts:164

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` when the run's `tool.call` sequence matches `reference` under `mode`, else `0`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `reference` | [`ReferenceTrajectory`](/reference/evals/type-aliases/referencetrajectory/) | the pinned golden [ReferenceTrajectory](/reference/evals/type-aliases/referencetrajectory/) — a `{ tool, input? }[]` (pin one from a recorded run with [referenceFromTrajectory](/reference/evals/functions/referencefromtrajectory/)). |
| `opts?` | [`MatchOptions`](/reference/evals/interfaces/matchoptions/) | [MatchOptions](/reference/evals/interfaces/matchoptions/): the sequence `mode` (default `"superset"`), the `toolArgs` comparison, and optional `perTool` comparators. |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `trajectory:{mode}`; a mismatch is explained in the score's `rationale`.

## Remarks

A single assertion over ordering, presence, and arguments — the trajectory counterpart to text-output
  scorers like [outputMatches](/reference/evals/functions/outputmatches/). See [calledInOrder](/reference/evals/functions/calledinorder/) for a name-only ordered check.

## Example

```ts
// The agent must search, then book Istanbul — extra calls allowed, args must match:
matchesTrajectory([{ tool: "search" }, { tool: "book", input: { city: "Istanbul" } }], { mode: "superset" });
```
