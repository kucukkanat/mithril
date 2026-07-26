---
editUrl: false
next: false
prev: false
title: "isScript"
---

```ts
function isScript(body): body is ToolScript & JsonValue;
```

Defined in: [script.ts:61](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/authoring/src/script.ts#L61)

Narrow an opaque definition `body` to a [ToolScript](/mithril/reference/authoring/index/interfaces/toolscript/).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `JsonValue` |

## Returns

`body is ToolScript & JsonValue`
