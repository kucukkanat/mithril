---
editUrl: false
next: false
prev: false
title: "RunDiff"
---

Defined in: diff.ts:27

The four-way outcome of [diffRuns](/reference/evals/functions/diffruns/), each a list of case keys.

## Properties

### added

```ts
readonly added: readonly string[];
```

Defined in: diff.ts:33

Keys present only in `current`.

***

### improved

```ts
readonly improved: readonly string[];
```

Defined in: diff.ts:29

Keys that flipped fail → pass.

***

### regressed

```ts
readonly regressed: readonly string[];
```

Defined in: diff.ts:31

Keys that flipped pass → fail.

***

### removed

```ts
readonly removed: readonly string[];
```

Defined in: diff.ts:35

Keys present only in `baseline`.
