---
editUrl: false
next: false
prev: false
title: "SuiteOptions"
---

```ts
type SuiteOptions<Deps, Ctx> = RunEvalOptions<Deps, Ctx> & {
  minPassRate?: number;
  onRun?: (run) => void;
};
```

Defined in: [index.ts:459](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L459)

Options for [runSuite](/reference/evals/functions/runsuite/): [RunEvalOptions](/reference/evals/type-aliases/runevaloptions/) plus a CI pass-rate gate and a per-run callback.

## Type Declaration

### minPassRate?

```ts
readonly optional minPassRate?: number;
```

### onRun?

```ts
readonly optional onRun?: (run) => void;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `run` | [`SuiteRun`](/reference/evals/interfaces/suiterun/) |

#### Returns

`void`

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | - |
| `Ctx` | `void` |

## Remarks

`minPassRate` defaults to `1` (every case must pass). `onRun` fires as each case completes — use
it to stream progress to the console while the suite runs.
