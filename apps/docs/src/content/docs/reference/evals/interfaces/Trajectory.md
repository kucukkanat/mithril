---
editUrl: false
next: false
prev: false
title: "Trajectory"
---

Defined in: index.ts:22

The observable result of a single agent run: `{ runId, log, final }`, where `log` is the ordered event
stream and `final` is the RunState reconstructed from it via `replay`.

## Remarks

The event log is the fixture — [Scorer](/reference/evals/type-aliases/scorer/)s are pure functions over this value.

## Properties

### final

```ts
readonly final: RunState;
```

Defined in: index.ts:25

***

### log

```ts
readonly log: readonly MithrilEvent[];
```

Defined in: index.ts:24

***

### runId

```ts
readonly runId: string;
```

Defined in: index.ts:23
