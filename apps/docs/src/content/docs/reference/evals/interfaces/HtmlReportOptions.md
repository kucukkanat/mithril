---
editUrl: false
next: false
prev: false
title: "HtmlReportOptions"
---

Defined in: [report.ts:30](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L30)

Options for [htmlReport](/reference/evals/functions/htmlreport/).

## Extended by

- [`InspectorReportOptions`](/reference/evals/interfaces/inspectorreportoptions/)

## Properties

### baseline?

```ts
readonly optional baseline?: RunSnapshot;
```

Defined in: [report.ts:40](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L40)

A baseline [RunSnapshot](/reference/evals/interfaces/runsnapshot/) to diff against. When present, each row is badged improved / regressed /
new, regressions sort to the top, and a "changes" filter appears — turning the report into a
regression view.

***

### generatedAt?

```ts
readonly optional generatedAt?: string;
```

Defined in: [report.ts:34](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L34)

ISO timestamp shown in the header (default: now). Pass one for reproducible output.

***

### title?

```ts
readonly optional title?: string;
```

Defined in: [report.ts:32](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L32)

Document title and page heading (default `"Mithril eval report"`).
