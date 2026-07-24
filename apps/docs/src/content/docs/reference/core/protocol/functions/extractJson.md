---
editUrl: false
next: false
prev: false
title: "extractJson"
---

```ts
function extractJson(s): 
  | JsonValue
  | undefined;
```

Defined in: [packages/core/src/protocol/json-repair.ts:132](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/json-repair.ts#L132)

Extract and parse the JSON value from a model's FINAL structured-output text.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `s` | `string` | the model's complete final text (may include a `<think>…</think>` preamble and/or surrounding prose). |

## Returns

  \| [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)
  \| `undefined`

the parsed [JsonValue](/mithril/reference/core/protocol/type-aliases/jsonvalue/), or `undefined` when no JSON can be recovered.

## Remarks

Strips reasoning blocks and prose, then delegates to [repairJson](/mithril/reference/core/protocol/functions/repairjson/) (code fences, trailing
commas, unterminated containers). Structured-output ONLY — it never alters the event stream, so reasoning
tokens still reach the UI via `text.delta`. Lossless for already-valid JSON (fast path). See
[repairPartialJson](/mithril/reference/core/protocol/functions/repairpartialjson/) for the streaming counterpart.
