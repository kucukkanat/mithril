---
editUrl: false
next: false
prev: false
title: "isSuspend"
---

```ts
function isSuspend(value): value is Suspend<unknown>;
```

Defined in: [packages/core/src/protocol/suspension.ts:119](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/suspension.ts#L119)

Type-guard for a [Suspend](/reference/core/protocol/interfaces/suspend/) marker.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | Any value. |

## Returns

`value is Suspend<unknown>`

Whether `value` is a [Suspend](/reference/core/protocol/interfaces/suspend/) marker.
