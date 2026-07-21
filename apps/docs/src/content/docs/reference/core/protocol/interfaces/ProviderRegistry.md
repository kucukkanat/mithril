---
editUrl: false
next: false
prev: false
title: "ProviderRegistry"
---

Defined in: packages/core/src/protocol/provider.ts:103

Resolves a [ModelId](/reference/core/protocol/type-aliases/modelid/) to its [Provider](/reference/core/protocol/interfaces/provider/) over the set of registered [ProviderSpec](/reference/core/protocol/interfaces/providerspec/)s.

## Properties

### specs

```ts
readonly specs: readonly ProviderSpec[];
```

Defined in: packages/core/src/protocol/provider.ts:105

## Methods

### resolve()

```ts
resolve(model): Provider;
```

Defined in: packages/core/src/protocol/provider.ts:104

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | `` `${string}/${string}` `` |

#### Returns

[`Provider`](/reference/core/protocol/interfaces/provider/)
