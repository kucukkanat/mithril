---
editUrl: false
next: false
prev: false
title: "toSnapshot"
---

```ts
function toSnapshot(runs, opts?): RunSnapshot;
```

Defined in: diff.ts:54

Compress [EvalRun](/reference/evals/interfaces/evalrun/)s (or [SuiteRun](/reference/evals/interfaces/suiterun/)s) into a [RunSnapshot](/reference/evals/interfaces/runsnapshot/) of per-case pass/fail + scores.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `runs` | readonly [`EvalRun`](/reference/evals/interfaces/evalrun/)[] | the runs to summarize; a [SuiteRun](/reference/evals/interfaces/suiterun/)'s `group` is carried onto its summary. |
| `opts?` | \{ `generatedAt?`: `string`; \} | `generatedAt` overrides the ISO timestamp (pass one for reproducible output). |
| `opts.generatedAt?` | `string` | - |

## Returns

[`RunSnapshot`](/reference/evals/interfaces/runsnapshot/)

a [RunSnapshot](/reference/evals/interfaces/runsnapshot/) suitable for persisting as a baseline.
