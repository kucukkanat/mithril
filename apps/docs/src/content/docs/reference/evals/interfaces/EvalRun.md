---
editUrl: false
next: false
prev: false
title: "EvalRun"
---

Defined in: [index.ts:63](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L63)

The outcome of evaluating one [EvalCase](/reference/evals/interfaces/evalcase/): its scores, the captured [Trajectory](/reference/evals/interfaces/trajectory/), and whether
every score met the threshold.

## Remarks

`passed` is `true` only when all `scores` have `value >= threshold`.

## Extended by

- [`SuiteRun`](/reference/evals/interfaces/suiterun/)

## Properties

### case

```ts
readonly case: string;
```

Defined in: [index.ts:64](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L64)

***

### passed

```ts
readonly passed: boolean;
```

Defined in: [index.ts:67](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L67)

***

### scores

```ts
readonly scores: readonly Score[];
```

Defined in: [index.ts:65](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L65)

***

### trajectory

```ts
readonly trajectory: Trajectory;
```

Defined in: [index.ts:66](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L66)
