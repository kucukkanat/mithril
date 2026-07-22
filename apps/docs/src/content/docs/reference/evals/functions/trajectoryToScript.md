---
editUrl: false
next: false
prev: false
title: "trajectoryToScript"
---

```ts
function trajectoryToScript(t): ProviderChunk[][];
```

Defined in: [index.ts:221](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/index.ts#L221)

Extract the model turns from a recorded [Trajectory](/reference/evals/interfaces/trajectory/) as a scriptedProvider script — one
`ProviderChunk[]` per step, carrying that step's `text.delta`s and `tool.call`s (tool *results* are
excluded — the real tools re-run).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `t` | [`Trajectory`](/reference/evals/interfaces/trajectory/) | a recorded trajectory (from [runEval](/reference/evals/functions/runeval/) or [loadTrajectory](/reference/evals/functions/loadtrajectory/)). |

## Returns

`ProviderChunk`[][]

the turns array to pass to `scriptedProvider(...)`.

## Remarks

This is the bridge that makes replay exercise the **real agent loop and real tools**: feed the
script to `scriptedProvider`/`testModel` and run the actual agent, instead of re-emitting the stored event
log wholesale (which runs nothing). Use it to regression-test tool or loop changes against a recorded
conversation. The model's exact wording is preserved; only the provider calls are replaced by the script.

## Example

```ts
import { scriptedProvider, testModel } from "@mithril/core/testkit";

const script = trajectoryToScript(recorded);
const replayed = agent({ model: testModel(scriptedProvider(script)), instructions, tools }); // real tools run
```
