---
editUrl: false
next: false
prev: false
title: "toolErrorClass"
---

```ts
function toolErrorClass(err): 
  | ToolErrorClass
  | undefined;
```

Defined in: [packages/core/src/protocol/errors.ts:30](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/errors.ts#L30)

Read the [ToolErrorClass](/mithril/reference/core/protocol/type-aliases/toolerrorclass/) attached to a [SerializedError](/mithril/reference/core/protocol/interfaces/serializederror/), if any.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `err` | [`SerializedError`](/mithril/reference/core/protocol/interfaces/serializederror/) | a serialized error, typically from a `tool.error` event. |

## Returns

  \| [`ToolErrorClass`](/mithril/reference/core/protocol/type-aliases/toolerrorclass/)
  \| `undefined`

the attached class, or `undefined` when the error carries none.
