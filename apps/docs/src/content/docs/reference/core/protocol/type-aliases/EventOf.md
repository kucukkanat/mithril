---
editUrl: false
next: false
prev: false
title: "EventOf"
---

```ts
type EventOf<T> = Extract<MithrilEvent, {
  type: T;
}>;
```

Defined in: [packages/core/src/protocol/events.ts:102](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/events.ts#L102)

The specific [MithrilEvent](/mithril/reference/core/protocol/type-aliases/mithrilevent/) member whose discriminant is `T`.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` *extends* [`EventType`](/mithril/reference/core/protocol/type-aliases/eventtype/) | An [EventType](/mithril/reference/core/protocol/type-aliases/eventtype/) literal, e.g. `'tool.call'`. |
