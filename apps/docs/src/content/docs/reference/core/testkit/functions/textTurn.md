---
editUrl: false
next: false
prev: false
title: "textTurn"
---

```ts
function textTurn(text, finishReason?): readonly ProviderChunk[];
```

Defined in: [packages/core/src/testkit/index.ts:29](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/testkit/index.ts#L29)

Build a single model turn that streams `text` and ends — the common "the model just answers" turn, so a
test doesn't hand-write the `text.delta` + `message.end` pair.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `text` | `string` | `undefined` | the assistant text to stream as one `text.delta`. |
| `finishReason` | [`FinishReason`](/reference/core/protocol/type-aliases/finishreason/) | `"stop"` | the turn's finish reason (default `"stop"`). |

## Returns

readonly [`ProviderChunk`](/reference/core/protocol/type-aliases/providerchunk/)[]

a [ProviderChunk](/reference/core/protocol/type-aliases/providerchunk/) array to place in a [scriptedProvider](/reference/core/testkit/functions/scriptedprovider/) script.

## Example

```ts
scriptedProvider([textTurn("It is 22°C.")]);
```
