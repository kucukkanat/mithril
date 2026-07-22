---
editUrl: false
next: false
prev: false
title: "SpanSink"
---

Defined in: [index.ts:45](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/otel/src/index.ts#L45)

Receiver for reconstructed spans — implement this to bridge [toGenAiSpans](/reference/otel/functions/togenaispans/) to a real OTel exporter.

## Methods

### onSpan()

```ts
onSpan(span): void;
```

Defined in: [index.ts:47](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/otel/src/index.ts#L47)

Called once per completed span, in creation order.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `span` | [`GenAiSpan`](/reference/otel/interfaces/genaispan/) |

#### Returns

`void`
