---
editUrl: false
next: false
prev: false
title: "llmJudge"
---

```ts
function llmJudge(opts): Scorer;
```

Defined in: [index.ts:720](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L720)

An LLM-as-judge [Scorer](/reference/evals/type-aliases/scorer/): runs a small judge agent on the run's final text and returns its `0..1`
score. The judge is prompted to reply with `{"score", "rationale"}` JSON, which is parsed into the score.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | \{ `model`: `ModelInput`; `name?`: `string`; `rubric`: `string`; `transport?`: `Transport`; \} | `model` (any ModelInput — a judge handle), the grading `rubric`, an optional scorer `name` (default `"llmJudge"`), and `transport` for the judge's provider auth. |
| `opts.model` | `ModelInput` | - |
| `opts.name?` | `string` | - |
| `opts.rubric` | `string` | - |
| `opts.transport?` | `Transport` | - |

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

an async [Scorer](/reference/evals/type-aliases/scorer/); a judge that errors or returns non-JSON scores `0` with a rationale.

## Remarks

Unlike the trajectory scorers, this makes a real model call, so it runs only against a live/local
judge model (not the scripted test double). Keep the rubric specific and the judge model cheap.

## Example

```ts
llmJudge({ model: anthropic("claude-3-5-haiku-latest"), rubric: "Is the answer correct and concise?" });
```
