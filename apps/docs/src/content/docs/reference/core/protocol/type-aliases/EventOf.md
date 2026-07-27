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

Defined in: [packages/core/src/protocol/events.ts:121](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/events.ts#L121)

The specific [MithrilEvent](/mithril/reference/core/protocol/type-aliases/mithrilevent/) member whose discriminant is `T`.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` *extends* [`EventType`](/mithril/reference/core/protocol/type-aliases/eventtype/) | An [EventType](/mithril/reference/core/protocol/type-aliases/eventtype/) literal, e.g. `'tool.call'`. |
