---
editUrl: false
next: false
prev: false
title: "isKnownEvent"
---

```ts
function isKnownEvent(e): boolean;
```

Defined in: [packages/core/src/protocol/migrate.ts:47](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/migrate.ts#L47)

Tolerant guard: `true` for any known event member or any `custom.*` type.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `e` | [`MithrilEvent`](/mithril/reference/core/protocol/type-aliases/mithrilevent/) | The event to classify. |

## Returns

`boolean`

Whether `e` is a recognized or custom event.

## Remarks

Deliberately does not `assertNever`, so evolving the (non-exhaustive) union
never compile-breaks a consumer that routes unknowns to a default branch.
