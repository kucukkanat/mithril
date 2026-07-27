---
editUrl: false
next: false
prev: false
title: "isComposition"
---

```ts
function isComposition(body): body is ToolComposition & JsonValue;
```

Defined in: [compose.ts:39](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/compose.ts#L39)

Narrow an opaque definition `body` to a [ToolComposition](/mithril/reference/authoring/index/interfaces/toolcomposition/).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `JsonValue` |

## Returns

`body is ToolComposition & JsonValue`
