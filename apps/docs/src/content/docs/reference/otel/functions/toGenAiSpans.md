---
editUrl: false
next: false
prev: false
title: "toGenAiSpans"
---

```ts
function toGenAiSpans(
   events, 
   sink?, 
   opts?): readonly GenAiSpan[];
```

Defined in: [index.ts:70](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/otel/src/index.ts#L70)

Reconstruct [GenAiSpan](/mithril/reference/otel/interfaces/genaispan/)s from a Mithril event stream, optionally forwarding them to a [SpanSink](/mithril/reference/otel/interfaces/spansink/).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `events` | `Iterable`\<`MithrilEvent`\> | The events to fold into spans (grouped by `span.id`). |
| `sink?` | [`SpanSink`](/mithril/reference/otel/interfaces/spansink/) | Optional sink; when provided, every span is passed to [SpanSink.onSpan](/mithril/reference/otel/interfaces/spansink/#onspan) after folding. |
| `opts?` | \{ `captureContent?`: `boolean`; \} | Options; set `captureContent: true` to record tool input payloads. |
| `opts.captureContent?` | `boolean` | - |

## Returns

readonly [`GenAiSpan`](/mithril/reference/otel/interfaces/genaispan/)[]

All reconstructed spans, in creation order.

## Remarks

Metadata attributes (model, output tokens, tool name) are always captured. Content — prompt/tool
inputs — is opt-in via `opts.captureContent` and defaults to off.

## Example

```ts
import { toGenAiSpans } from "@mithril/otel";

const spans = toGenAiSpans(run.events, { onSpan: (s) => exporter.export(s) });
// or collect without a sink:
const collected = toGenAiSpans(run.events);
```
