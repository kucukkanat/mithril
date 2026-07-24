---
editUrl: false
next: false
prev: false
title: "Provider"
---

Defined in: [packages/core/src/protocol/provider.ts:83](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/provider.ts#L83)

A model provider: its [ProviderSpec](/mithril/reference/core/protocol/interfaces/providerspec/) plus a streaming `chat` entry point.

## Properties

### spec

```ts
readonly spec: ProviderSpec;
```

Defined in: [packages/core/src/protocol/provider.ts:84](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/provider.ts#L84)

## Methods

### chat()

```ts
chat(
   req, 
   rt, 
   transport, 
signal): AsyncGenerator<ProviderChunk>;
```

Defined in: [packages/core/src/protocol/provider.ts:93](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/provider.ts#L93)

Stream one model call as [ProviderChunk](/mithril/reference/core/protocol/type-aliases/providerchunk/)s.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `req` | [`ChatRequest`](/mithril/reference/core/protocol/interfaces/chatrequest/) | The semantic request. |
| `rt` | [`RuntimeAdapter`](/mithril/reference/core/protocol/interfaces/runtimeadapter/) | The [RuntimeAdapter](/mithril/reference/core/protocol/interfaces/runtimeadapter/) supplying `fetch`/time/crypto. |
| `transport` | [`Transport`](/mithril/reference/core/protocol/type-aliases/transport/) | How the request reaches the model ([Transport](/mithril/reference/core/protocol/type-aliases/transport/)). |
| `signal` | `AbortSignal` | Abort signal for cancellation. |

#### Returns

`AsyncGenerator`\<[`ProviderChunk`](/mithril/reference/core/protocol/type-aliases/providerchunk/)\>
