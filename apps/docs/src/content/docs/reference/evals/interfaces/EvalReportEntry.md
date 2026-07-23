---
editUrl: false
next: false
prev: false
title: "EvalReportEntry"
---

Defined in: [report.ts:21](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L21)

One row of an HTML report: an [EvalRun](/reference/evals/interfaces/evalrun/) plus optional presentation metadata.

## Remarks

`group` labels the row (e.g. the model id) and drives the group filter; `durationMs` is shown
per row and summed in the header. Map each `runEval` result into one of these.

## Properties

### durationMs?

```ts
readonly optional durationMs?: number;
```

Defined in: [report.ts:26](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L26)

Wall-clock time for the case, in milliseconds (shown per row and summed).

***

### group?

```ts
readonly optional group?: string;
```

Defined in: [report.ts:24](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L24)

A grouping label shown as a column and offered in the group filter — typically the model id.

***

### run

```ts
readonly run: EvalRun;
```

Defined in: [report.ts:22](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L22)
