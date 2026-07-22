---
editUrl: false
next: false
prev: false
title: "htmlReport"
---

```ts
function htmlReport(entries, opts?): string;
```

Defined in: [report.ts:226](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/report.ts#L226)

Render eval results into a complete, self-contained HTML report (returns the document as a string).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entries` | readonly [`EvalReportEntry`](/reference/evals/interfaces/evalreportentry/)[] | the rows to show; map each `runEval`/`runEvalCached` result into an [EvalReportEntry](/reference/evals/interfaces/evalreportentry/). |
| `opts?` | [`HtmlReportOptions`](/reference/evals/interfaces/htmlreportoptions/) | [HtmlReportOptions](/reference/evals/interfaces/htmlreportoptions/) (title, timestamp). |

## Returns

`string`

a full `<!doctype html>` document — no external CSS/JS/network — with summary stats and a
  filter-by-pass/fail, filter-by-group, free-text-search list of cases (scores, output, tool calls, cost).

## Example

```ts
import { runEval, htmlReport, type EvalReportEntry } from "@mithril/evals";

const entries: EvalReportEntry[] = [];
for await (const run of runEval(agent, cases, { deps })) entries.push({ run, group: "gpt-4o-mini" });
await Bun.write("report.html", htmlReport(entries, { title: "Nightly evals" }));
```
