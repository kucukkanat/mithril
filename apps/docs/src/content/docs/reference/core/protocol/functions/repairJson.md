---
editUrl: false
next: false
prev: false
title: "repairJson"
---

```ts
function repairJson(s): 
  | JsonValue
  | undefined;
```

Defined in: [packages/core/src/protocol/json-repair.ts:17](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/json-repair.ts#L17)

Best-effort repair of not-quite-JSON text into a [JsonValue](/mithril/reference/core/protocol/type-aliases/jsonvalue/).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `s` | `string` | raw text, e.g. a small model's tool-call arguments. |

## Returns

  \| [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)
  \| `undefined`

the parsed value, or `undefined` when even the repaired text will not parse.

## Remarks

Strips a leading/trailing markdown code fence, removes trailing commas, and closes any
unterminated string/object/array, then parses. Already-valid JSON parses on the fast path unchanged.
