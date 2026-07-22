---
editUrl: false
next: false
prev: false
title: "Provider"
---

Defined in: [packages/core/src/protocol/provider.ts:83](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/provider.ts#L83)

A model provider: its [ProviderSpec](/reference/core/protocol/interfaces/providerspec/) plus a streaming `chat` entry point.

## Properties

### spec

```ts
readonly spec: ProviderSpec;
```

Defined in: [packages/core/src/protocol/provider.ts:84](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/provider.ts#L84)

## Methods

### chat()

```ts
chat(
   req, 
   rt, 
   transport, 
signal): AsyncGenerator<ProviderChunk>;
```

Defined in: [packages/core/src/protocol/provider.ts:93](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/provider.ts#L93)

Stream one model call as [ProviderChunk](/reference/core/protocol/type-aliases/providerchunk/)s.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `req` | [`ChatRequest`](/reference/core/protocol/interfaces/chatrequest/) | The semantic request. |
| `rt` | [`RuntimeAdapter`](/reference/core/protocol/interfaces/runtimeadapter/) | The [RuntimeAdapter](/reference/core/protocol/interfaces/runtimeadapter/) supplying `fetch`/time/crypto. |
| `transport` | [`Transport`](/reference/core/protocol/type-aliases/transport/) | How the request reaches the model ([Transport](/reference/core/protocol/type-aliases/transport/)). |
| `signal` | `AbortSignal` | Abort signal for cancellation. |

#### Returns

`AsyncGenerator`\<[`ProviderChunk`](/reference/core/protocol/type-aliases/providerchunk/)\>
