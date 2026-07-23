---
editUrl: false
next: false
prev: false
title: "classifiedError"
---

```ts
function classifiedError(
   name, 
   message, 
   cls, 
   opts?): SerializedError;
```

Defined in: [packages/core/src/protocol/errors.ts:48](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/errors.ts#L48)

Build a classified [SerializedError](/reference/core/protocol/interfaces/serializederror/) for a tool failure.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | the error `name` (e.g. the originating error's name, or `"UnknownTool"`). |
| `message` | `string` | a human- and model-readable message. |
| `cls` | [`ToolErrorClass`](/reference/core/protocol/type-aliases/toolerrorclass/) | the [ToolErrorClass](/reference/core/protocol/type-aliases/toolerrorclass/) to attach under `data.class`. |
| `opts?` | \{ `code?`: `string`; `retryable?`: `boolean`; \} | optional `retryable` flag and originating `code` (carried under `data.code`). |
| `opts.code?` | `string` | - |
| `opts.retryable?` | `boolean` | - |

## Returns

[`SerializedError`](/reference/core/protocol/interfaces/serializederror/)

a JSON-safe `SerializedError` discriminable by [toolErrorClass](/reference/core/protocol/functions/toolerrorclass/).
