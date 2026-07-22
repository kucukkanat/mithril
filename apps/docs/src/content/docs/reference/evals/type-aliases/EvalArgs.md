---
editUrl: false
next: false
prev: false
title: "EvalArgs"
---

```ts
type EvalArgs<Deps, Ctx> = [Deps] extends [void] ? [RunEvalOptions<void, Ctx>] : [RunEvalOptions<Deps, Ctx>];
```

Defined in: [index.ts:92](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L92)

The trailing options argument of [runEval](/reference/evals/functions/runeval/)/[describeEval](/reference/evals/functions/describeeval/), made fully optional when `Deps` is
`void` — so a no-deps eval is just `runEval(agent, cases)`, with no `{ deps: undefined }` ceremony.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |
| `Ctx` |
