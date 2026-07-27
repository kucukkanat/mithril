---
editUrl: false
next: false
prev: false
title: "isComposition"
---

```ts
function isComposition(body): body is ToolComposition & JsonValue;
```

Defined in: [compose.ts:39](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/compose.ts#L39)

Narrow an opaque definition `body` to a [ToolComposition](/mithril/reference/authoring/index/interfaces/toolcomposition/).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `JsonValue` |

## Returns

`body is ToolComposition & JsonValue`
