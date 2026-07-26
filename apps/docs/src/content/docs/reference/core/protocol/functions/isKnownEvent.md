---
editUrl: false
next: false
prev: false
title: "isKnownEvent"
---

```ts
function isKnownEvent(e): boolean;
```

Defined in: [packages/core/src/protocol/migrate.ts:49](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/migrate.ts#L49)

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
