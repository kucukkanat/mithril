---
editUrl: false
next: false
prev: false
title: "globalConsumers"
---

```ts
function globalConsumers(): readonly EventConsumer[];
```

Defined in: [packages/core/src/agent/global-consumers.ts:36](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/global-consumers.ts#L36)

The currently-registered global consumers (empty array when none — a cheap no-op fast path).

## Returns

readonly [`EventConsumer`](/reference/core/protocol/interfaces/eventconsumer/)[]
