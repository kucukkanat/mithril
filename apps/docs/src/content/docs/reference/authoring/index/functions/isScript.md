---
editUrl: false
next: false
prev: false
title: "isScript"
---

```ts
function isScript(body): body is ToolScript & JsonValue;
```

Defined in: [script.ts:61](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/script.ts#L61)

Narrow an opaque definition `body` to a [ToolScript](/mithril/reference/authoring/index/interfaces/toolscript/).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `JsonValue` |

## Returns

`body is ToolScript & JsonValue`
