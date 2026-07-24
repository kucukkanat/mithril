---
editUrl: false
next: false
prev: false
title: "repairPartialJson"
---

```ts
function repairPartialJson(s): 
  | JsonValue
  | undefined;
```

Defined in: [packages/core/src/protocol/json-repair.ts:150](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/json-repair.ts#L150)

Best-effort parse of an IN-PROGRESS structured-output stream into a deep-partial [JsonValue](/mithril/reference/core/protocol/type-aliases/jsonvalue/), for
`object.delta` streaming.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `s` | `string` | the structured-output text accumulated so far. |

## Returns

  \| [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)
  \| `undefined`

the partial value, or `undefined` when nothing parseable has formed yet.

## Remarks

Holds back entirely while a `<think>` block is still open (reasoning is not the answer), then skips
any preamble and closes the open strings/objects/arrays formed so far. Reasoning is never removed from the
event stream — this only governs the partial value. See [extractJson](/mithril/reference/core/protocol/functions/extractjson/) for the terminal counterpart.
