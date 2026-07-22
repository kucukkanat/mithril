---
editUrl: false
next: false
prev: false
title: "Provider"
---

Defined in: [packages/core/src/protocol/provider.ts:70](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/provider.ts#L70)

A model provider: its [ProviderSpec](/reference/core/protocol/interfaces/providerspec/) plus a streaming `chat` entry point.

## Properties

### spec

```ts
readonly spec: ProviderSpec;
```

Defined in: [packages/core/src/protocol/provider.ts:71](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/provider.ts#L71)

## Methods

### chat()

```ts
chat(
   req, 
   rt, 
   transport, 
signal): AsyncGenerator<ProviderChunk>;
```

Defined in: [packages/core/src/protocol/provider.ts:80](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/provider.ts#L80)

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
