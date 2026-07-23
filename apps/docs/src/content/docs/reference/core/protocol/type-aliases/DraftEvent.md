---
editUrl: false
next: false
prev: false
title: "DraftEvent"
---

```ts
type DraftEvent = 
  | {
  payload: JsonValue;
  type: `custom.${string}`;
}
  | Omit<EventOf<"tool.repair">, keyof EventMeta>
  | Omit<EventOf<"tool.retry">, keyof EventMeta>
  | Omit<EventOf<"loop.detected">, keyof EventMeta>
| Omit<EventOf<"object.invalid">, keyof EventMeta>;
```

Defined in: [packages/core/src/protocol/middleware.ts:33](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/middleware.ts#L33)

An un-stamped event a middleware may [MiddlewareContext.emit](/reference/core/protocol/interfaces/middlewarecontext/#emit); the loop stamps [EventMeta](/reference/core/protocol/interfaces/eventmeta/).

## Remarks

Besides the open `custom.*` escape hatch, a middleware may emit the self-correction events the
built-in `healing.*` stack produces — `tool.repair`, `tool.retry`, `loop.detected`, and `object.invalid` —
so a user-authored healing middleware yields the exact same, replayable event stream as the built-ins.
