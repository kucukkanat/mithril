---
editUrl: false
next: false
prev: false
title: "SuiteArgs"
---

```ts
type SuiteArgs<Deps, Ctx> = [Deps] extends [void] ? [SuiteOptions<void, Ctx>] : [SuiteOptions<Deps, Ctx>];
```

Defined in: [index.ts:429](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L429)

The trailing options argument of [runSuite](/reference/evals/functions/runsuite/), made optional when `Deps` is `void`.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |
| `Ctx` |
