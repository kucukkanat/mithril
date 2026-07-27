---
editUrl: false
next: false
prev: false
title: "classifyEvent"
---

```ts
function classifyEvent(type): EventKind;
```

Defined in: [packages/devtools/src/selectors.ts:18](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/devtools/src/selectors.ts#L18)

Classify an event `type` into a colour-coded [EventKind](/mithril/reference/devtools/index/type-aliases/eventkind/) family for the inspector.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `type` | `string` | a MithrilEvent discriminant (or any string; unknown/`custom.*` map sensibly). |

## Returns

[`EventKind`](/mithril/reference/devtools/index/type-aliases/eventkind/)

the family used to colour the event's row.
