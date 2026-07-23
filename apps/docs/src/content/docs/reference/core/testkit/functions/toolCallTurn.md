---
editUrl: false
next: false
prev: false
title: "toolCallTurn"
---

```ts
function toolCallTurn(
   name, 
   input, 
   callId?): readonly ProviderChunk[];
```

Defined in: [packages/core/src/testkit/index.ts:48](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/testkit/index.ts#L48)

Build a single model turn that calls one tool and ends — the common "the model invokes a tool" turn.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `name` | `string` | `undefined` | the tool name to call. |
| `input` | [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | `undefined` | the tool-call arguments ([JsonValue](/reference/core/protocol/type-aliases/jsonvalue/)). |
| `callId` | `string` | `"c1"` | the call id correlating this call to its result (default `"c1"`). |

## Returns

readonly [`ProviderChunk`](/reference/core/protocol/type-aliases/providerchunk/)[]

a [ProviderChunk](/reference/core/protocol/type-aliases/providerchunk/) array to place in a [scriptedProvider](/reference/core/testkit/functions/scriptedprovider/) script.

## Example

```ts
scriptedProvider([toolCallTurn("weather", { city: "NYC" }), textTurn("It is sunny.")]);
```
