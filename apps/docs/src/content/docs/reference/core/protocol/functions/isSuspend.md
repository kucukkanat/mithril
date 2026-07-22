---
editUrl: false
next: false
prev: false
title: "isSuspend"
---

```ts
function isSuspend(value): value is Suspend<unknown>;
```

Defined in: [packages/core/src/protocol/suspension.ts:119](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/suspension.ts#L119)

Type-guard for a [Suspend](/reference/core/protocol/interfaces/suspend/) marker.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | Any value. |

## Returns

`value is Suspend<unknown>`

Whether `value` is a [Suspend](/reference/core/protocol/interfaces/suspend/) marker.
