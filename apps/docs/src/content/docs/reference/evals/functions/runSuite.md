---
editUrl: false
next: false
prev: false
title: "runSuite"
---

```ts
function runSuite<Deps, Ctx>(entries, ...args): Promise<SuiteResult>;
```

Defined in: [index.ts:450](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L450)

Run a matrix of [SuiteEntry](/reference/evals/interfaces/suiteentry/)s (each an agent + its cases) and aggregate the results behind a
pass-rate CI gate — the batteries-included counterpart to calling [runEval](/reference/evals/functions/runeval/) in nested loops.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | - |
| `Ctx` | `void` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entries` | readonly [`SuiteEntry`](/reference/evals/interfaces/suiteentry/)\<`Deps`, `Ctx`\>[] | the groups to run; every case in each entry is scored against that entry's agent. |
| ...`args` | [`SuiteArgs`](/reference/evals/type-aliases/suiteargs/)\<`Deps`, `Ctx`\> | [SuiteOptions](/reference/evals/type-aliases/suiteoptions/) (optional when `Deps` is `void`): scorer `deps`/`makeContext`, `threshold`, plus `minPassRate` (the CI gate) and `onRun` (per-case progress). |

## Returns

`Promise`\<[`SuiteResult`](/reference/evals/interfaces/suiteresult/)\>

a [SuiteResult](/reference/evals/interfaces/suiteresult/) whose `ok` is the gate verdict — wire it to `process.exitCode`.

## Example

```ts
const result = await runSuite(
  models.map((m) => ({ label: m, agent: agent({ model: m, instructions: "…", tools }), cases })),
  { minPassRate: 0.8, onRun: (r) => console.log(r.group, r.case, r.passed) },
);
process.exitCode = result.ok ? 0 : 1;
```
