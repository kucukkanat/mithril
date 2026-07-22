---
editUrl: false
next: false
prev: false
title: "inputToJson"
---

```ts
function inputToJson(input): JsonValue;
```

Defined in: [packages/core/src/agent/agent-types.ts:217](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L217)

Project run [Input](/reference/core/agent/type-aliases/input/) into its JSON-safe form for the `run.start` event.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | [`Input`](/reference/core/agent/type-aliases/input/) | a bare string or a list of [InputMessage](/reference/core/agent/type-aliases/inputmessage/)s. |

## Returns

[`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/)

the string unchanged, or an array of `{ role, content }` objects.
