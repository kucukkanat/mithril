---
editUrl: false
next: false
prev: false
title: "Scorer"
---

```ts
type Scorer<Ctx> = (t, ctx) => 
  | Score
| Promise<Score>;
```

Defined in: index.ts:44

A scoring function: given a [Trajectory](/reference/evals/interfaces/trajectory/) and caller context, returns a [Score](/reference/evals/interfaces/score/) (sync or async).

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Ctx` | `void` | Per-run context type produced by `RunEvalOptions.makeContext` (defaults to `void`). |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `t` | [`Trajectory`](/reference/evals/interfaces/trajectory/) |
| `ctx` | `Ctx` |

## Returns

  \| [`Score`](/reference/evals/interfaces/score/)
  \| `Promise`\<[`Score`](/reference/evals/interfaces/score/)\>

## See

[calledTool](/reference/evals/functions/calledtool/) and [completed](/reference/evals/functions/completed/) for ready-made scorers.
