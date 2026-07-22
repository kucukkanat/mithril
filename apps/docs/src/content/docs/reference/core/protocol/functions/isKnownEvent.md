---
editUrl: false
next: false
prev: false
title: "isKnownEvent"
---

```ts
function isKnownEvent(e): boolean;
```

Defined in: [packages/core/src/protocol/migrate.ts:43](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/migrate.ts#L43)

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
