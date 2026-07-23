---
editUrl: false
next: false
prev: false
title: "Trajectory"
---

Defined in: [index.ts:23](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L23)

The observable result of a single agent run: `{ runId, log, final }`, where `log` is the ordered event
stream and `final` is the RunState reconstructed from it via `replay`.

## Remarks

The event log is the fixture — [Scorer](/reference/evals/type-aliases/scorer/)s are pure functions over this value.

## Properties

### final

```ts
readonly final: RunState;
```

Defined in: [index.ts:26](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L26)

***

### log

```ts
readonly log: readonly MithrilEvent[];
```

Defined in: [index.ts:25](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L25)

***

### runId

```ts
readonly runId: string;
```

Defined in: [index.ts:24](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L24)
