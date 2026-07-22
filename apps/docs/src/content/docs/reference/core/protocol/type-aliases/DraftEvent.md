---
editUrl: false
next: false
prev: false
title: "DraftEvent"
---

```ts
type DraftEvent = {
  payload: JsonValue;
  type: `custom.${string}`;
};
```

Defined in: [packages/core/src/protocol/middleware.ts:26](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L26)

An un-stamped `custom.*` event a middleware may emit; the loop stamps [EventMeta](/reference/core/protocol/interfaces/eventmeta/).

## Properties

### payload

```ts
readonly payload: JsonValue;
```

Defined in: [packages/core/src/protocol/middleware.ts:26](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L26)

***

### type

```ts
readonly type: `custom.${string}`;
```

Defined in: [packages/core/src/protocol/middleware.ts:26](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/middleware.ts#L26)
