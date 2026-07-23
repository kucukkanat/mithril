---
editUrl: false
next: false
prev: false
title: "InspectorReportOptions"
---

Defined in: [report.ts:44](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L44)

Options for [inspectorReport](/reference/evals/functions/inspectorreport/) — [HtmlReportOptions](/reference/evals/interfaces/htmlreportoptions/) plus the inspector's context window.

## Extends

- [`HtmlReportOptions`](/reference/evals/interfaces/htmlreportoptions/)

## Properties

### baseline?

```ts
readonly optional baseline?: RunSnapshot;
```

Defined in: [report.ts:40](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L40)

A baseline [RunSnapshot](/reference/evals/interfaces/runsnapshot/) to diff against. When present, each row is badged improved / regressed /
new, regressions sort to the top, and a "changes" filter appears — turning the report into a
regression view.

#### Inherited from

[`HtmlReportOptions`](/reference/evals/interfaces/htmlreportoptions/).[`baseline`](/reference/evals/interfaces/htmlreportoptions/#baseline)

***

### contextWindow?

```ts
readonly optional contextWindow?: number;
```

Defined in: [report.ts:49](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L49)

The model context window in tokens, used to draw each row inspector's context-fill bar. Omit it and the
meters still show tokens / cost / steps, just without the `% ctx` bar.

***

### generatedAt?

```ts
readonly optional generatedAt?: string;
```

Defined in: [report.ts:34](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L34)

ISO timestamp shown in the header (default: now). Pass one for reproducible output.

#### Inherited from

[`HtmlReportOptions`](/reference/evals/interfaces/htmlreportoptions/).[`generatedAt`](/reference/evals/interfaces/htmlreportoptions/#generatedat)

***

### title?

```ts
readonly optional title?: string;
```

Defined in: [report.ts:32](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L32)

Document title and page heading (default `"Mithril eval report"`).

#### Inherited from

[`HtmlReportOptions`](/reference/evals/interfaces/htmlreportoptions/).[`title`](/reference/evals/interfaces/htmlreportoptions/#title)
