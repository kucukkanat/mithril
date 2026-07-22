---
editUrl: false
next: false
prev: false
title: "SpanSink"
---

Defined in: [index.ts:45](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/otel/src/index.ts#L45)

Receiver for reconstructed spans — implement this to bridge [toGenAiSpans](/reference/otel/functions/togenaispans/) to a real OTel exporter.

## Methods

### onSpan()

```ts
onSpan(span): void;
```

Defined in: [index.ts:47](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/otel/src/index.ts#L47)

Called once per completed span, in creation order.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `span` | [`GenAiSpan`](/reference/otel/interfaces/genaispan/) |

#### Returns

`void`
