---
editUrl: false
next: false
prev: false
title: "globalConsumers"
---

```ts
function globalConsumers(): readonly EventConsumer[];
```

Defined in: packages/core/src/agent/global-consumers.ts:36

The currently-registered global consumers (empty array when none — a cheap no-op fast path).

## Returns

readonly [`EventConsumer`](/reference/core/protocol/interfaces/eventconsumer/)[]
