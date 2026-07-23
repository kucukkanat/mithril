---
editUrl: false
next: false
prev: false
title: "SuiteResult"
---

Defined in: [index.ts:445](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L445)

The aggregate outcome of [runSuite](/reference/evals/functions/runsuite/): every [SuiteRun](/reference/evals/interfaces/suiterun/), the pass counts, and the CI gate verdict.

## Remarks

`ok` is the machine-readable gate: `true` when at least one case ran and `passRate >= minPassRate`.

## Properties

### ok

```ts
readonly ok: boolean;
```

Defined in: [index.ts:450](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L450)

***

### passed

```ts
readonly passed: number;
```

Defined in: [index.ts:447](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L447)

***

### passRate

```ts
readonly passRate: number;
```

Defined in: [index.ts:449](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L449)

***

### runs

```ts
readonly runs: readonly SuiteRun[];
```

Defined in: [index.ts:446](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L446)

***

### total

```ts
readonly total: number;
```

Defined in: [index.ts:448](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L448)
