---
editUrl: false
next: false
prev: false
title: "CustomEventOf"
---

```ts
type CustomEventOf<Id, P> = EventMeta & {
  payload: P;
  type: `custom.${Id}`;
};
```

Defined in: [packages/core/src/protocol/events.ts:108](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/events.ts#L108)

The shape of a `custom.${Id}` event addressed by a specific custom `Id`.

## Type Declaration

### payload

```ts
readonly payload: P;
```

### type

```ts
readonly type: `custom.${Id}`;
```

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Id` *extends* `string` | - | The custom event id (the suffix after `custom.`). |
| `P` *extends* [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | The payload type; defaults to [JsonValue](/reference/core/protocol/type-aliases/jsonvalue/). |

## Remarks

Constructed directly rather than via [EventOf](/reference/core/protocol/type-aliases/eventof/) because
`Extract<MithrilEvent, { type: 'custom.foo' }>` yields `never` against the
`custom.${string}` template member.
