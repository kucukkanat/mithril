---
editUrl: false
next: false
prev: false
title: "SuiteArgs"
---

```ts
type SuiteArgs<Deps, Ctx> = [Deps] extends [void] ? [SuiteOptions<void, Ctx>] : [SuiteOptions<Deps, Ctx>];
```

Defined in: [index.ts:429](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L429)

The trailing options argument of [runSuite](/reference/evals/functions/runsuite/), made optional when `Deps` is `void`.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |
| `Ctx` |
