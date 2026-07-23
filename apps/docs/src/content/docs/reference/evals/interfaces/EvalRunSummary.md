---
editUrl: false
next: false
prev: false
title: "EvalRunSummary"
---

Defined in: diff.ts:12

A per-case row in a [RunSnapshot](/reference/evals/interfaces/runsnapshot/): enough to detect a pass↔fail flip without the full trajectory.

## Properties

### case

```ts
readonly case: string;
```

Defined in: diff.ts:13

***

### group?

```ts
readonly optional group?: string;
```

Defined in: diff.ts:15

The run's group label (e.g. the model id), when it came from a [runSuite](/reference/evals/functions/runsuite/) matrix.

***

### passed

```ts
readonly passed: boolean;
```

Defined in: diff.ts:16

***

### scores

```ts
readonly scores: readonly {
  name: string;
  value: number;
}[];
```

Defined in: diff.ts:17
