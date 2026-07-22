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

Defined in: packages/core/src/protocol/errors.ts:30

Read the [ToolErrorClass](/reference/core/protocol/type-aliases/toolerrorclass/) attached to a [SerializedError](/reference/core/protocol/interfaces/serializederror/), if any.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `err` | [`SerializedError`](/reference/core/protocol/interfaces/serializederror/) | a serialized error, typically from a `tool.error` event. |

## Returns

  \| [`ToolErrorClass`](/reference/core/protocol/type-aliases/toolerrorclass/)
  \| `undefined`

the attached class, or `undefined` when the error carries none.
