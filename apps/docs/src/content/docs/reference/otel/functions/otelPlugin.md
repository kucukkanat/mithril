---
editUrl: false
next: false
prev: false
title: "otelPlugin"
---

```ts
function otelPlugin(sink, opts?): Plugin;
```

Defined in: [index.ts:133](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/otel/src/index.ts#L133)

A Plugin that emits [GenAiSpan](/mithril/reference/otel/interfaces/genaispan/)s to `sink` as runs complete — the live counterpart to
[toGenAiSpans](/mithril/reference/otel/functions/togenaispans/), so tracing is `use: [otelPlugin(exporter)]` instead of manually buffering a run's
events and folding them yourself.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sink` | [`SpanSink`](/mithril/reference/otel/interfaces/spansink/) | the [SpanSink](/mithril/reference/otel/interfaces/spansink/) each run's reconstructed spans are forwarded to. |
| `opts?` | \{ `captureContent?`: `boolean`; \} | options; set `captureContent: true` to record tool input payloads. |
| `opts.captureContent?` | `boolean` | - |

## Returns

`Plugin`

a plugin whose event consumer buffers each run (keyed by `traceId`) and folds it to spans on the
terminal `run.finish` / `run.error` / `run.cancel` event.

## Remarks

Spans flush at run completion (not incrementally), so a run that suspends without finishing does
not emit until it resumes and completes. Add to any agent via `AgentConfig`'s `use` array.

## Example

```ts
import { otelPlugin } from "@mithril/otel";

const a = agent({ model, instructions: "…", use: [otelPlugin({ onSpan: (s) => exporter.export(s) })] });
```
