---
editUrl: false
next: false
prev: false
title: "migrate"
---

```ts
function migrate(event): MithrilEvent;
```

Defined in: [packages/core/src/protocol/migrate.ts:70](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/migrate.ts#L70)

Forward-only migration codec for a single event.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | [`MithrilEvent`](/mithril/reference/core/protocol/type-aliases/mithrilevent/) | An event tagged with a protocol MAJOR `v`. |

## Returns

[`MithrilEvent`](/mithril/reference/core/protocol/type-aliases/mithrilevent/)

The event unchanged (v1 is identity).

## Throws

[ProtocolVersionError](/mithril/reference/core/protocol/classes/protocolversionerror/) when `v` is not `1` — a newer or unknown
MAJOR is refused, never silently coerced.
