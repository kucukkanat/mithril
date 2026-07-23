---
editUrl: false
next: false
prev: false
title: "pairwiseJudge"
---

```ts
function pairwiseJudge(opts): (a, b) => Promise<Score>;
```

Defined in: [index.ts:758](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L758)

An LLM-as-judge **A/B comparator**: runs a judge over two runs' final texts and returns a [Score](/reference/evals/interfaces/score/)
favouring one — `1` when A wins, `0` when B wins, `0.5` on a tie. The head-to-head counterpart to
[llmJudge](/reference/evals/functions/llmjudge/), for "which model answered this case better?".

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | \{ `model`: `ModelInput`; `name?`: `string`; `rubric`: `string`; `transport?`: `Transport`; \} | `model` (the judge handle), the `rubric` deciding the winner, an optional `name` (default `"pairwise"`), and `transport` for the judge's provider auth. |
| `opts.model` | `ModelInput` | - |
| `opts.name?` | `string` | - |
| `opts.rubric` | `string` | - |
| `opts.transport?` | `Transport` | - |

## Returns

an async comparator `(a, b) => Promise<Score>`; a judge that errors or returns non-JSON scores `0.5`
  (neutral), never throwing.

(`a`, `b`) => `Promise`\<[`Score`](/reference/evals/interfaces/score/)\>

## Remarks

Makes a real model call, so it runs only against a live/local judge model. Unlike a [Scorer](/reference/evals/type-aliases/scorer/)
  it takes two [Trajectory](/reference/evals/interfaces/trajectory/)s rather than one — feed it two models' recorded runs of the same case.

## Example

```ts
const judge = pairwiseJudge({ model: anthropic("claude-3-5-haiku-latest"), rubric: "Which answer is more accurate and concise?" });
const score = await judge(runA.trajectory, runB.trajectory); // value 1 → A better, 0 → B better, 0.5 → tie
```
