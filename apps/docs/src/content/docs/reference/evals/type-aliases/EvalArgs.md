---
editUrl: false
next: false
prev: false
title: "EvalArgs"
---

```ts
type EvalArgs<Deps, Ctx> = [Deps] extends [void] ? [RunEvalOptions<void, Ctx>] : [RunEvalOptions<Deps, Ctx>];
```

Defined in: [index.ts:117](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L117)

The trailing options argument of [runEval](/reference/evals/functions/runeval/)/[describeEval](/reference/evals/functions/describeeval/), made fully optional when `Deps` is
`void` — so a no-deps eval is just `runEval(agent, cases)`, with no `{ deps: undefined }` ceremony.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |
| `Ctx` |
