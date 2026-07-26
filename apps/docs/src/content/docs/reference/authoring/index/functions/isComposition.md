---
editUrl: false
next: false
prev: false
title: "isComposition"
---

```ts
function isComposition(body): body is ToolComposition & JsonValue;
```

Defined in: [compose.ts:39](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/authoring/src/compose.ts#L39)

Narrow an opaque definition `body` to a [ToolComposition](/mithril/reference/authoring/index/interfaces/toolcomposition/).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `JsonValue` |

## Returns

`body is ToolComposition & JsonValue`
