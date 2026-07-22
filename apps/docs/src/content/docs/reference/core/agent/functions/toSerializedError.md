---
editUrl: false
next: false
prev: false
title: "toSerializedError"
---

```ts
function toSerializedError(err): SerializedError;
```

Defined in: [packages/core/src/agent/agent-types.ts:206](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L206)

Normalize an unknown thrown value into a JSON-safe [SerializedError](/reference/core/protocol/interfaces/serializederror/).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `err` | `unknown` | the caught value; `Error` instances keep their `name`/`message`, anything else is stringified. |

## Returns

[`SerializedError`](/reference/core/protocol/interfaces/serializederror/)

a `{ name, message }` pair safe to embed in events and results.
