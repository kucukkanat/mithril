---
editUrl: false
next: false
prev: false
title: "globalConsumers"
---

```ts
function globalConsumers(): readonly EventConsumer[];
```

Defined in: [packages/core/src/agent/global-consumers.ts:36](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/global-consumers.ts#L36)

The currently-registered global consumers (empty array when none — a cheap no-op fast path).

## Returns

readonly [`EventConsumer`](/mithril/reference/core/protocol/interfaces/eventconsumer/)[]
