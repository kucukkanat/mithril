---
editUrl: false
next: false
prev: false
title: "inspectorReport"
---

```ts
function inspectorReport(entries, opts?): Promise<string>;
```

Defined in: [report.ts:425](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/report.ts#L425)

Like [htmlReport](/reference/evals/functions/htmlreport/), but every case row hosts a live **`@mithril/devtools` run inspector** — the event
stream, message/tool transcript, span tree, and cost/context meters, with a time-travel scrubber — mounted
from the case's recorded trajectory. Still one self-contained file (the devtools UI + client are inlined);
it just renders the whole trajectory, not only the final output.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entries` | readonly [`EvalReportEntry`](/reference/evals/interfaces/evalreportentry/)[] | the rows to show; map each `runEval`/`runEvalCached` result into an [EvalReportEntry](/reference/evals/interfaces/evalreportentry/). |
| `opts?` | [`InspectorReportOptions`](/reference/evals/interfaces/inspectorreportoptions/) | [InspectorReportOptions](/reference/evals/interfaces/inspectorreportoptions/) (title, timestamp, and the model `contextWindow` for the fill bar). |

## Returns

`Promise`\<`string`\>

a Promise of a full `<!doctype html>` document with an embedded devtools inspector per case.

## Remarks

Requires the **Bun** runtime — it bundles the browser client with `Bun.build`. Use
[htmlReport](/reference/evals/functions/htmlreport/) for a runtime-agnostic, static report.

## Example

```ts
import { runEval, inspectorReport, type EvalReportEntry } from "@mithril/evals";

const entries: EvalReportEntry[] = [];
for await (const run of runEval(agent, cases, { deps })) entries.push({ run, group: "gpt-4o-mini" });
await Bun.write("report.html", await inspectorReport(entries, { title: "Nightly evals", contextWindow: 200_000 }));
```
