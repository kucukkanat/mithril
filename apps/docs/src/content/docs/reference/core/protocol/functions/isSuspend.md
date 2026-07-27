---
editUrl: false
next: false
prev: false
title: "isSuspend"
---

```ts
function isSuspend(value): value is Suspend<unknown>;
```

Defined in: [packages/core/src/protocol/suspension.ts:119](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/suspension.ts#L119)

Type-guard for a [Suspend](/mithril/reference/core/protocol/interfaces/suspend/) marker.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | Any value. |

## Returns

`value is Suspend<unknown>`

Whether `value` is a [Suspend](/mithril/reference/core/protocol/interfaces/suspend/) marker.
