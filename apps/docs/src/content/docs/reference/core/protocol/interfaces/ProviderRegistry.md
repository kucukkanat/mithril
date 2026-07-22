---
editUrl: false
next: false
prev: false
title: "ProviderRegistry"
---

Defined in: [packages/core/src/protocol/provider.ts:103](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/provider.ts#L103)

Resolves a [ModelId](/reference/core/protocol/type-aliases/modelid/) to its [Provider](/reference/core/protocol/interfaces/provider/) over the set of registered [ProviderSpec](/reference/core/protocol/interfaces/providerspec/)s.

## Properties

### specs

```ts
readonly specs: readonly ProviderSpec[];
```

Defined in: [packages/core/src/protocol/provider.ts:105](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/provider.ts#L105)

## Methods

### resolve()

```ts
resolve(model): Provider;
```

Defined in: [packages/core/src/protocol/provider.ts:104](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/provider.ts#L104)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | `` `${string}/${string}` `` |

#### Returns

[`Provider`](/reference/core/protocol/interfaces/provider/)
