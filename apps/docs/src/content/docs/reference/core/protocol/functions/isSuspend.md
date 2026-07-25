---
editUrl: false
next: false
prev: false
title: "isSuspend"
---

```ts
function isSuspend(value): value is Suspend<unknown>;
```

Defined in: [packages/core/src/protocol/suspension.ts:119](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/suspension.ts#L119)

Type-guard for a [Suspend](/mithril/reference/core/protocol/interfaces/suspend/) marker.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | Any value. |

## Returns

`value is Suspend<unknown>`

Whether `value` is a [Suspend](/mithril/reference/core/protocol/interfaces/suspend/) marker.
