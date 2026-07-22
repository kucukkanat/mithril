---
editUrl: false
next: false
prev: false
title: "providerRegistry"
---

```ts
function providerRegistry(...providers): ProviderRegistry;
```

Defined in: [packages/core/src/agent/registry.ts:34](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/registry.ts#L34)

Assemble a [ProviderRegistry](/reference/core/protocol/interfaces/providerregistry/) from one or more providers, keyed by each provider's spec id.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`providers` | readonly [`Provider`](/reference/core/protocol/interfaces/provider/)[] | the providers to register; the `provider` segment of a `provider/model` id selects one. |

## Returns

[`ProviderRegistry`](/reference/core/protocol/interfaces/providerregistry/)

a registry exposing the collected `specs` and a `resolve(model)` lookup.

## Throws

[MithrilError](/reference/core/agent/classes/mithrilerror/) `NO_PROVIDER` from `resolve` when no registered provider matches the model id.
