---
editUrl: false
next: false
prev: false
title: "EvalArgs"
---

```ts
type EvalArgs<Deps, Ctx> = [Deps] extends [void] ? [RunEvalOptions<void, Ctx>] : [RunEvalOptions<Deps, Ctx>];
```

Defined in: [index.ts:92](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/index.ts#L92)

The trailing options argument of [runEval](/reference/evals/functions/runeval/)/[describeEval](/reference/evals/functions/describeeval/), made fully optional when `Deps` is
`void` — so a no-deps eval is just `runEval(agent, cases)`, with no `{ deps: undefined }` ceremony.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |
| `Ctx` |
