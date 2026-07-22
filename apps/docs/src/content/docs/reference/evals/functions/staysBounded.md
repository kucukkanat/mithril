---
editUrl: false
next: false
prev: false
title: "staysBounded"
---

```ts
function staysBounded(): Scorer;
```

Defined in: [index.ts:583](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/index.ts#L583)

A [Scorer](/reference/evals/type-aliases/scorer/) that scores `1` unless a guard stopped the run — i.e. it hit no loop-detection halt and
no token/cost `budget.exceeded`.

## Returns

[`Scorer`](/reference/evals/type-aliases/scorer/)

a [Scorer](/reference/evals/type-aliases/scorer/) named `bounded`.

## Remarks

Catches runaway trajectories: a run that a guard had to terminate is not a healthy run, even if
the guard did its job. Useful as a regression check that a self-correcting agent converges.
