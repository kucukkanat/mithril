---
editUrl: false
next: false
prev: false
title: "migrate"
---

```ts
function migrate(event): MithrilEvent;
```

Defined in: [packages/core/src/protocol/migrate.ts:64](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/migrate.ts#L64)

Forward-only migration codec for a single event.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | [`MithrilEvent`](/reference/core/protocol/type-aliases/mithrilevent/) | An event tagged with a protocol MAJOR `v`. |

## Returns

[`MithrilEvent`](/reference/core/protocol/type-aliases/mithrilevent/)

The event unchanged (v1 is identity).

## Throws

[ProtocolVersionError](/reference/core/protocol/classes/protocolversionerror/) when `v` is not `1` — a newer or unknown
MAJOR is refused, never silently coerced.
