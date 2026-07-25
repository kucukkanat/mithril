---
editUrl: false
next: false
prev: false
title: "isComposition"
---

```ts
function isComposition(body): body is ToolComposition & JsonValue;
```

Defined in: compose.ts:39

Narrow an opaque definition `body` to a [ToolComposition](/mithril/reference/authoring/index/interfaces/toolcomposition/).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `JsonValue` |

## Returns

`body is ToolComposition & JsonValue`
