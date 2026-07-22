---
editUrl: false
next: false
prev: false
title: "resolveModel"
---

```ts
function resolveModel(model, registry?): {
  id: `${string}/${string}`;
  provider: Provider;
};
```

Defined in: [packages/core/src/agent/registry.ts:66](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/registry.ts#L66)

Resolve a [ModelInput](/reference/core/protocol/type-aliases/modelinput/) to its concrete id and serving provider.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | [`ModelInput`](/reference/core/protocol/type-aliases/modelinput/) | a self-wiring ModelHandle (carries its own provider) or a bare `provider/model` id. |
| `registry?` | [`ProviderRegistry`](/reference/core/protocol/interfaces/providerregistry/) | the [ProviderRegistry](/reference/core/protocol/interfaces/providerregistry/) used to look up the provider for a bare-string model. |

## Returns

```ts
{
  id: `${string}/${string}`;
  provider: Provider;
}
```

the resolved `{ id, provider }`.

### id

```ts
readonly id: `${string}/${string}`;
```

### provider

```ts
readonly provider: Provider;
```

## Throws

[MithrilError](/reference/core/agent/classes/mithrilerror/) `NO_PROVIDER` when `model` is a bare string but no registry is supplied, or
when the registry has no matching provider.
