---
editUrl: false
next: false
prev: false
title: "migrate"
---

```ts
function migrate(event): MithrilEvent;
```

Defined in: [packages/core/src/protocol/migrate.ts:68](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/migrate.ts#L68)

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
