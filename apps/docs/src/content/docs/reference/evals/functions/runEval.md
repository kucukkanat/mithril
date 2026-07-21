---
editUrl: false
next: false
prev: false
title: "runEval"
---

```ts
function runEval<Deps, Ctx>(
   agent, 
   cases, 
opts): AsyncGenerator<EvalRun>;
```

Defined in: index.ts:111

Runs each [EvalCase](/reference/evals/interfaces/evalcase/) against `agent`, yielding one [EvalRun](/reference/evals/interfaces/evalrun/) per case as it completes.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | - | The agent's dependency type. |
| `Ctx` | `void` | Per-run scorer context type. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agent` | `Agent`\<readonly `AnyTool`\<`Deps`\>[], `Deps`, `JsonValue`\> | The agent under test; each case is executed via `agent.stream`. |
| `cases` | readonly [`EvalCase`](/reference/evals/interfaces/evalcase/)\<`Ctx`\>[] | The evaluation cases to run, in order. |
| `opts` | [`RunEvalOptions`](/reference/evals/interfaces/runevaloptions/)\<`Deps`, `Ctx`\> | [RunEvalOptions](/reference/evals/interfaces/runevaloptions/) supplying `deps`, optional `transport`/`runtime`, `makeContext`, and `threshold`. |

## Returns

`AsyncGenerator`\<[`EvalRun`](/reference/evals/interfaces/evalrun/)\>

An async generator of [EvalRun](/reference/evals/interfaces/evalrun/) results, one per case.

## Remarks

Records LIVE by streaming the agent — the full event log is drained per case and the final state is
reconstructed with `replay`. For a deterministic, network-free record-once / replay-from-file split, use
[runEvalCached](/reference/evals/functions/runevalcached/) with a [TrajectoryStore](/reference/evals/interfaces/trajectorystore/).

## Example

```ts
for await (const run of runEval(agent, cases, { deps, threshold: 1 })) {
  console.log(run.case, run.passed, run.scores);
}
```
