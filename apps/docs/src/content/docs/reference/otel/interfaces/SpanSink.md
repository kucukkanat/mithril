---
editUrl: false
next: false
prev: false
title: "SpanSink"
---

Defined in: [index.ts:45](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/otel/src/index.ts#L45)

Receiver for reconstructed spans — implement this to bridge [toGenAiSpans](/mithril/reference/otel/functions/togenaispans/) to a real OTel exporter.

## Methods

### onSpan()

```ts
onSpan(span): void;
```

Defined in: [index.ts:47](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/otel/src/index.ts#L47)

Called once per completed span, in creation order.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `span` | [`GenAiSpan`](/mithril/reference/otel/interfaces/genaispan/) |

#### Returns

`void`
