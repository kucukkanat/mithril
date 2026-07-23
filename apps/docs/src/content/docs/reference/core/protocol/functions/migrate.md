---
editUrl: false
next: false
prev: false
title: "migrate"
---

```ts
function migrate(event): MithrilEvent;
```

Defined in: [packages/core/src/protocol/migrate.ts:68](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/migrate.ts#L68)

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
