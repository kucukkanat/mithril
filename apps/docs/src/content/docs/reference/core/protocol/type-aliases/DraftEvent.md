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

Defined in: [packages/core/src/protocol/middleware.ts:26](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L26)

An un-stamped `custom.*` event a middleware may emit; the loop stamps [EventMeta](/reference/core/protocol/interfaces/eventmeta/).

## Properties

### payload

```ts
readonly payload: JsonValue;
```

Defined in: [packages/core/src/protocol/middleware.ts:26](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L26)

***

### type

```ts
readonly type: `custom.${string}`;
```

Defined in: [packages/core/src/protocol/middleware.ts:26](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L26)
