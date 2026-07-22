---
editUrl: false
next: false
prev: false
title: "EvalReportEntry"
---

Defined in: [report.ts:18](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/report.ts#L18)

One row of an HTML report: an [EvalRun](/reference/evals/interfaces/evalrun/) plus optional presentation metadata.

## Remarks

`group` labels the row (e.g. the model id) and drives the group filter; `durationMs` is shown
per row and summed in the header. Map each `runEval` result into one of these.

## Properties

### durationMs?

```ts
readonly optional durationMs?: number;
```

Defined in: [report.ts:23](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/report.ts#L23)

Wall-clock time for the case, in milliseconds (shown per row and summed).

***

### group?

```ts
readonly optional group?: string;
```

Defined in: [report.ts:21](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/report.ts#L21)

A grouping label shown as a column and offered in the group filter — typically the model id.

***

### run

```ts
readonly run: EvalRun;
```

Defined in: [report.ts:19](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/report.ts#L19)
