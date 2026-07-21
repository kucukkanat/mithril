---
editUrl: false
next: false
prev: false
title: "isKnownEvent"
---

```ts
function isKnownEvent(e): boolean;
```

Defined in: packages/core/src/protocol/migrate.ts:43

Tolerant guard: `true` for any known event member or any `custom.*` type.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `e` | [`MithrilEvent`](/reference/core/protocol/type-aliases/mithrilevent/) | The event to classify. |

## Returns

`boolean`

Whether `e` is a recognized or custom event.

## Remarks

Deliberately does not `assertNever`, so evolving the (non-exhaustive) union
never compile-breaks a consumer that routes unknowns to a default branch.
