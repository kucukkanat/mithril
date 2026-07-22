---
editUrl: false
next: false
prev: false
title: "SuiteArgs"
---

```ts
type SuiteArgs<Deps, Ctx> = [Deps] extends [void] ? [SuiteOptions<void, Ctx>] : [SuiteOptions<Deps, Ctx>];
```

Defined in: [index.ts:429](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/index.ts#L429)

The trailing options argument of [runSuite](/reference/evals/functions/runsuite/), made optional when `Deps` is `void`.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |
| `Ctx` |
