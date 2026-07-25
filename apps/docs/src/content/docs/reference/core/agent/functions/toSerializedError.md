---
editUrl: false
next: false
prev: false
title: "toSerializedError"
---

```ts
function toSerializedError(err): SerializedError;
```

Defined in: [packages/core/src/agent/agent-types.ts:245](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L245)

Normalize an unknown thrown value into a JSON-safe [SerializedError](/mithril/reference/core/protocol/interfaces/serializederror/).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `err` | `unknown` | the caught value. A [MithrilError](/mithril/reference/core/agent/classes/mithrilerror/) additionally carries its `code` onto `data.code` and sets `retryable` for RETRYABLE\_CODES; other `Error`s keep `name`/`message`; anything else is stringified. |

## Returns

[`SerializedError`](/mithril/reference/core/protocol/interfaces/serializederror/)

a `SerializedError` safe to embed in events and results.
