---
editUrl: false
next: false
prev: false
title: "testModel"
---

```ts
function testModel(provider, id?): ModelHandle;
```

Defined in: [packages/core/src/testkit/index.ts:122](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/testkit/index.ts#L122)

Wrap a test [Provider](/mithril/reference/core/protocol/interfaces/provider/) in a self-wiring [ModelHandle](/mithril/reference/core/protocol/interfaces/modelhandle/) for direct use as an agent's `model`.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `provider` | [`Provider`](/mithril/reference/core/protocol/interfaces/provider/) | `undefined` | the provider to bind, typically from [scriptedProvider](/mithril/reference/core/testkit/functions/scriptedprovider/). |
| `id` | `` `${string}/${string}` `` | `"test/x"` | the model id (default `"test/x"`, matching the scripted provider's spec). |

## Returns

[`ModelHandle`](/mithril/reference/core/protocol/interfaces/modelhandle/)

a `ModelHandle` that carries its provider, so no ProviderRegistry is needed.
