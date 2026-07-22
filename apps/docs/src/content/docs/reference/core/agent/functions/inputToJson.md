---
editUrl: false
next: false
prev: false
title: "inputToJson"
---

```ts
function inputToJson(input): JsonValue;
```

Defined in: [packages/core/src/agent/agent-types.ts:248](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/agent/agent-types.ts#L248)

Project run [Input](/reference/core/agent/type-aliases/input/) into its JSON-safe form for the `run.start` event.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | [`Input`](/reference/core/agent/type-aliases/input/) | a bare string or a list of [InputMessage](/reference/core/agent/type-aliases/inputmessage/)s. |

## Returns

[`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/)

the string unchanged, or an array of `{ role, content }` objects.
