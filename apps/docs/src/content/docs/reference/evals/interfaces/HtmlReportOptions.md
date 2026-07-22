---
editUrl: false
next: false
prev: false
title: "HtmlReportOptions"
---

Defined in: [report.ts:29](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/report.ts#L29)

Options for [htmlReport](/reference/evals/functions/htmlreport/).

## Extended by

- [`InspectorReportOptions`](/reference/evals/interfaces/inspectorreportoptions/)

## Properties

### generatedAt?

```ts
readonly optional generatedAt?: string;
```

Defined in: [report.ts:33](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/report.ts#L33)

ISO timestamp shown in the header (default: now). Pass one for reproducible output.

***

### title?

```ts
readonly optional title?: string;
```

Defined in: [report.ts:31](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/report.ts#L31)

Document title and page heading (default `"Mithril eval report"`).
