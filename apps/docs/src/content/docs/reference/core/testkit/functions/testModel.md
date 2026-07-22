---
editUrl: false
next: false
prev: false
title: "testModel"
---

```ts
function testModel(provider, id?): ModelHandle;
```

Defined in: [packages/core/src/testkit/index.ts:122](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/testkit/index.ts#L122)

Wrap a test [Provider](/reference/core/protocol/interfaces/provider/) in a self-wiring [ModelHandle](/reference/core/protocol/interfaces/modelhandle/) for direct use as an agent's `model`.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `provider` | [`Provider`](/reference/core/protocol/interfaces/provider/) | `undefined` | the provider to bind, typically from [scriptedProvider](/reference/core/testkit/functions/scriptedprovider/). |
| `id` | `` `${string}/${string}` `` | `"test/x"` | the model id (default `"test/x"`, matching the scripted provider's spec). |

## Returns

[`ModelHandle`](/reference/core/protocol/interfaces/modelhandle/)

a `ModelHandle` that carries its provider, so no ProviderRegistry is needed.
