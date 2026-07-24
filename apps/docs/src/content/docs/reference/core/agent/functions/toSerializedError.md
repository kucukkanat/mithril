---
editUrl: false
next: false
prev: false
title: "toSerializedError"
---

```ts
function toSerializedError(err): SerializedError;
```

Defined in: [packages/core/src/agent/agent-types.ts:229](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/agent-types.ts#L229)

Normalize an unknown thrown value into a JSON-safe [SerializedError](/reference/core/protocol/interfaces/serializederror/).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `err` | `unknown` | the caught value. A [MithrilError](/reference/core/agent/classes/mithrilerror/) additionally carries its `code` onto `data.code` and sets `retryable` for RETRYABLE\_CODES; other `Error`s keep `name`/`message`; anything else is stringified. |

## Returns

[`SerializedError`](/reference/core/protocol/interfaces/serializederror/)

a `SerializedError` safe to embed in events and results.
