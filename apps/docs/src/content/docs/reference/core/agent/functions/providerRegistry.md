---
editUrl: false
next: false
prev: false
title: "providerRegistry"
---

```ts
function providerRegistry(...providers): ProviderRegistry;
```

Defined in: [packages/core/src/agent/registry.ts:43](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/registry.ts#L43)

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
