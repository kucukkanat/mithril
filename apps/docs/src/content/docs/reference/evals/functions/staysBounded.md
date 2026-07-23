---
editUrl: false
next: false
prev: false
title: "staysBounded"
---

```ts
function staysBounded(): Scorer;
```

Defined in: [index.ts:619](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L619)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` unless a guard stopped the run — i.e. it hit no loop-detection halt and
no token/cost `budget.exceeded`.

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `bounded`.

## Remarks

Catches runaway trajectories: a run that a guard had to terminate is not a healthy run, even if
the guard did its job. Useful as a regression check that a self-correcting agent converges.
