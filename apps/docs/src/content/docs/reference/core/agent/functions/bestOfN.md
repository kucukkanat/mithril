---
editUrl: false
next: false
prev: false
title: "bestOfN"
---

```ts
function bestOfN(opts): Middleware;
```

Defined in: packages/core/src/agent/test-time.ts:91

Best-of-N: draw `n` candidates and keep the highest-scoring one (the T1 pattern — pair a small generator
with a deterministic verifier).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`BestOfNOptions`](/reference/core/agent/interfaces/bestofnoptions/) | the candidate count, a `score` function, and an optional early-stop `threshold`. |

## Returns

[`Middleware`](/reference/core/protocol/interfaces/middleware/)

a model-altitude [Middleware](/reference/core/protocol/interfaces/middleware/) to pass in an agent's `use` array.

## Remarks

Prefer a *deterministic* scorer (does the output parse? does a check tool pass?) over asking a
small model to judge itself — the research is clear that small-model self-verification is weak. Emits
`custom.bestOfN` per candidate. Cost is up to `n`× per model turn; opt-in.
