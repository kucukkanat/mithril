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

Defined in: [packages/core/src/protocol/events.ts:121](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/events.ts#L121)

The specific [MithrilEvent](/mithril/reference/core/protocol/type-aliases/mithrilevent/) member whose discriminant is `T`.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` *extends* [`EventType`](/mithril/reference/core/protocol/type-aliases/eventtype/) | An [EventType](/mithril/reference/core/protocol/type-aliases/eventtype/) literal, e.g. `'tool.call'`. |
