---
editUrl: false
next: false
prev: false
title: "globalConsumers"
---

```ts
function globalConsumers(): readonly EventConsumer[];
```

Defined in: [packages/core/src/agent/global-consumers.ts:36](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/global-consumers.ts#L36)

The currently-registered global consumers (empty array when none — a cheap no-op fast path).

## Returns

readonly [`EventConsumer`](/mithril/reference/core/protocol/interfaces/eventconsumer/)[]
