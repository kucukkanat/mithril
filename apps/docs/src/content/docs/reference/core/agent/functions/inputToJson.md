---
editUrl: false
next: false
prev: false
title: "inputToJson"
---

```ts
function inputToJson(input): JsonValue;
```

Defined in: [packages/core/src/agent/agent-types.ts:260](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L260)

Project run [Input](/mithril/reference/core/agent/type-aliases/input/) into its JSON-safe form for the `run.start` event.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | [`Input`](/mithril/reference/core/agent/type-aliases/input/) | a bare string or a list of [InputMessage](/mithril/reference/core/agent/type-aliases/inputmessage/)s. |

## Returns

[`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)

the string unchanged, or an array of `{ role, content }` objects.
