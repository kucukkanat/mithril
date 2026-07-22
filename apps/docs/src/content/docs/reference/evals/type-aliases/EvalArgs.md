---
editUrl: false
next: false
prev: false
title: "EvalArgs"
---

```ts
type EvalArgs<Deps, Ctx> = [Deps] extends [void] ? [RunEvalOptions<void, Ctx>] : [RunEvalOptions<Deps, Ctx>];
```

Defined in: [index.ts:92](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L92)

The trailing options argument of [runEval](/reference/evals/functions/runeval/)/[describeEval](/reference/evals/functions/describeeval/), made fully optional when `Deps` is
`void` — so a no-deps eval is just `runEval(agent, cases)`, with no `{ deps: undefined }` ceremony.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |
| `Ctx` |
