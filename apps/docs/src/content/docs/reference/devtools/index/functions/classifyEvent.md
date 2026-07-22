---
editUrl: false
next: false
prev: false
title: "classifyEvent"
---

```ts
function classifyEvent(type): EventKind;
```

Defined in: [packages/devtools/src/selectors.ts:18](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/devtools/src/selectors.ts#L18)

Classify an event `type` into a colour-coded [EventKind](/reference/devtools/index/type-aliases/eventkind/) family for the inspector.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `type` | `string` | a MithrilEvent discriminant (or any string; unknown/`custom.*` map sensibly). |

## Returns

[`EventKind`](/reference/devtools/index/type-aliases/eventkind/)

the family used to colour the event's row.
