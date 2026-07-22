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

Defined in: [packages/core/src/protocol/events.ts:95](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/events.ts#L95)

The specific [MithrilEvent](/reference/core/protocol/type-aliases/mithrilevent/) member whose discriminant is `T`.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` *extends* [`EventType`](/reference/core/protocol/type-aliases/eventtype/) | An [EventType](/reference/core/protocol/type-aliases/eventtype/) literal, e.g. `'tool.call'`. |
