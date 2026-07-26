---
editUrl: false
next: false
prev: false
title: "isSuspend"
---

```ts
function isSuspend(value): value is Suspend<unknown>;
```

Defined in: [packages/core/src/protocol/suspension.ts:119](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/suspension.ts#L119)

Type-guard for a [Suspend](/mithril/reference/core/protocol/interfaces/suspend/) marker.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | Any value. |

## Returns

`value is Suspend<unknown>`

Whether `value` is a [Suspend](/mithril/reference/core/protocol/interfaces/suspend/) marker.
