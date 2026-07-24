---
editUrl: false
next: false
prev: false
title: "providerRegistry"
---

```ts
function providerRegistry(...providers): ProviderRegistry;
```

Defined in: [packages/core/src/agent/registry.ts:43](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/registry.ts#L43)

Assemble a [ProviderRegistry](/mithril/reference/core/protocol/interfaces/providerregistry/) from one or more providers, keyed by each provider's spec id.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`providers` | readonly [`Provider`](/mithril/reference/core/protocol/interfaces/provider/)[] | the providers to register; the `provider` segment of a `provider/model` id selects one. |

## Returns

[`ProviderRegistry`](/mithril/reference/core/protocol/interfaces/providerregistry/)

a registry exposing the collected `specs` and a `resolve(model)` lookup.

## Throws

[MithrilError](/mithril/reference/core/agent/classes/mithrilerror/) `NO_PROVIDER` from `resolve` when no registered provider matches the model id.
