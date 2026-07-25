---
editUrl: false
next: false
prev: false
title: "ProviderRegistry"
---

Defined in: [packages/core/src/protocol/provider.ts:116](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/provider.ts#L116)

Resolves a [ModelId](/mithril/reference/core/protocol/type-aliases/modelid/) to its [Provider](/mithril/reference/core/protocol/interfaces/provider/) over the set of registered [ProviderSpec](/mithril/reference/core/protocol/interfaces/providerspec/)s.

## Properties

### specs

```ts
readonly specs: readonly ProviderSpec[];
```

Defined in: [packages/core/src/protocol/provider.ts:118](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/provider.ts#L118)

## Methods

### resolve()

```ts
resolve(model): Provider;
```

Defined in: [packages/core/src/protocol/provider.ts:117](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/provider.ts#L117)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | `` `${string}/${string}` `` |

#### Returns

[`Provider`](/mithril/reference/core/protocol/interfaces/provider/)
