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

Defined in: [packages/core/src/protocol/errors.ts:48](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/errors.ts#L48)

Build a classified [SerializedError](/mithril/reference/core/protocol/interfaces/serializederror/) for a tool failure.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | the error `name` (e.g. the originating error's name, or `"UnknownTool"`). |
| `message` | `string` | a human- and model-readable message. |
| `cls` | [`ToolErrorClass`](/mithril/reference/core/protocol/type-aliases/toolerrorclass/) | the [ToolErrorClass](/mithril/reference/core/protocol/type-aliases/toolerrorclass/) to attach under `data.class`. |
| `opts?` | \{ `code?`: `string`; `retryable?`: `boolean`; \} | optional `retryable` flag and originating `code` (carried under `data.code`). |
| `opts.code?` | `string` | - |
| `opts.retryable?` | `boolean` | - |

## Returns

[`SerializedError`](/mithril/reference/core/protocol/interfaces/serializederror/)

a JSON-safe `SerializedError` discriminable by [toolErrorClass](/mithril/reference/core/protocol/functions/toolerrorclass/).
