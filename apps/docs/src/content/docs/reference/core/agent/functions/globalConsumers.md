---
editUrl: false
next: false
prev: false
title: "globalConsumers"
---

```ts
function globalConsumers(): readonly EventConsumer[];
```

Defined in: [packages/core/src/agent/global-consumers.ts:36](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/global-consumers.ts#L36)

The currently-registered global consumers (empty array when none — a cheap no-op fast path).

## Returns

readonly [`EventConsumer`](/reference/core/protocol/interfaces/eventconsumer/)[]
