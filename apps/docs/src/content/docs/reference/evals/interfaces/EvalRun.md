---
editUrl: false
next: false
prev: false
title: "EvalRun"
---

Defined in: index.ts:62

The outcome of evaluating one [EvalCase](/reference/evals/interfaces/evalcase/): its scores, the captured [Trajectory](/reference/evals/interfaces/trajectory/), and whether
every score met the threshold.

## Remarks

`passed` is `true` only when all `scores` have `value >= threshold`.

## Properties

### case

```ts
readonly case: string;
```

Defined in: index.ts:63

***

### passed

```ts
readonly passed: boolean;
```

Defined in: index.ts:66

***

### scores

```ts
readonly scores: readonly Score[];
```

Defined in: index.ts:64

***

### trajectory

```ts
readonly trajectory: Trajectory;
```

Defined in: index.ts:65
