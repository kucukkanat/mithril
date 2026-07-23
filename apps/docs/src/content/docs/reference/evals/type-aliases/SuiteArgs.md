---
editUrl: false
next: false
prev: false
title: "SuiteArgs"
---

```ts
type SuiteArgs<Deps, Ctx> = [Deps] extends [void] ? [SuiteOptions<void, Ctx>] : [SuiteOptions<Deps, Ctx>];
```

Defined in: [index.ts:465](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L465)

The trailing options argument of [runSuite](/reference/evals/functions/runsuite/), made optional when `Deps` is `void`.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |
| `Ctx` |
