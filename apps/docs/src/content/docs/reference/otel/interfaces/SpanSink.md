---
editUrl: false
next: false
prev: false
title: "SpanSink"
---

Defined in: index.ts:45

Receiver for reconstructed spans — implement this to bridge [toGenAiSpans](/reference/otel/functions/togenaispans/) to a real OTel exporter.

## Methods

### onSpan()

```ts
onSpan(span): void;
```

Defined in: index.ts:47

Called once per completed span, in creation order.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `span` | [`GenAiSpan`](/reference/otel/interfaces/genaispan/) |

#### Returns

`void`
