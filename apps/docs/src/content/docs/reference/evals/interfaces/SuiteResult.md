---
editUrl: false
next: false
prev: false
title: "SuiteResult"
---

Defined in: [index.ts:409](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L409)

The aggregate outcome of [runSuite](/reference/evals/functions/runsuite/): every [SuiteRun](/reference/evals/interfaces/suiterun/), the pass counts, and the CI gate verdict.

## Remarks

`ok` is the machine-readable gate: `true` when at least one case ran and `passRate >= minPassRate`.

## Properties

### ok

```ts
readonly ok: boolean;
```

Defined in: [index.ts:414](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L414)

***

### passed

```ts
readonly passed: number;
```

Defined in: [index.ts:411](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L411)

***

### passRate

```ts
readonly passRate: number;
```

Defined in: [index.ts:413](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L413)

***

### runs

```ts
readonly runs: readonly SuiteRun[];
```

Defined in: [index.ts:410](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L410)

***

### total

```ts
readonly total: number;
```

Defined in: [index.ts:412](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L412)
