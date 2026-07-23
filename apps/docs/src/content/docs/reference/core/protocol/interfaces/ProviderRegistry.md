---
editUrl: false
next: false
prev: false
title: "ProviderRegistry"
---

Defined in: [packages/core/src/protocol/provider.ts:116](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/provider.ts#L116)

Resolves a [ModelId](/reference/core/protocol/type-aliases/modelid/) to its [Provider](/reference/core/protocol/interfaces/provider/) over the set of registered [ProviderSpec](/reference/core/protocol/interfaces/providerspec/)s.

## Properties

### specs

```ts
readonly specs: readonly ProviderSpec[];
```

Defined in: [packages/core/src/protocol/provider.ts:118](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/provider.ts#L118)

## Methods

### resolve()

```ts
resolve(model): Provider;
```

Defined in: [packages/core/src/protocol/provider.ts:117](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/provider.ts#L117)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | `` `${string}/${string}` `` |

#### Returns

[`Provider`](/reference/core/protocol/interfaces/provider/)
