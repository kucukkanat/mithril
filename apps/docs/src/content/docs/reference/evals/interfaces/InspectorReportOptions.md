---
editUrl: false
next: false
prev: false
title: "InspectorReportOptions"
---

Defined in: [report.ts:37](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/report.ts#L37)

Options for [inspectorReport](/reference/evals/functions/inspectorreport/) — [HtmlReportOptions](/reference/evals/interfaces/htmlreportoptions/) plus the inspector's context window.

## Extends

- [`HtmlReportOptions`](/reference/evals/interfaces/htmlreportoptions/)

## Properties

### contextWindow?

```ts
readonly optional contextWindow?: number;
```

Defined in: [report.ts:42](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/report.ts#L42)

The model context window in tokens, used to draw each row inspector's context-fill bar. Omit it and the
meters still show tokens / cost / steps, just without the `% ctx` bar.

***

### generatedAt?

```ts
readonly optional generatedAt?: string;
```

Defined in: [report.ts:33](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/report.ts#L33)

ISO timestamp shown in the header (default: now). Pass one for reproducible output.

#### Inherited from

[`HtmlReportOptions`](/reference/evals/interfaces/htmlreportoptions/).[`generatedAt`](/reference/evals/interfaces/htmlreportoptions/#generatedat)

***

### title?

```ts
readonly optional title?: string;
```

Defined in: [report.ts:31](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/report.ts#L31)

Document title and page heading (default `"Mithril eval report"`).

#### Inherited from

[`HtmlReportOptions`](/reference/evals/interfaces/htmlreportoptions/).[`title`](/reference/evals/interfaces/htmlreportoptions/#title)
