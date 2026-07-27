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

Defined in: [packages/core/src/agent/registry.ts:75](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/registry.ts#L75)

Resolve a [ModelInput](/mithril/reference/core/protocol/type-aliases/modelinput/) to its concrete id and serving provider.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | [`ModelInput`](/mithril/reference/core/protocol/type-aliases/modelinput/) | a self-wiring ModelHandle (carries its own provider) or a bare `provider/model` id. |
| `registry?` | [`ProviderRegistry`](/mithril/reference/core/protocol/interfaces/providerregistry/) | the [ProviderRegistry](/mithril/reference/core/protocol/interfaces/providerregistry/) used to look up the provider for a bare-string model. |

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

[MithrilError](/mithril/reference/core/agent/classes/mithrilerror/) `NO_PROVIDER` when `model` is a bare string but no registry is supplied, or
when the registry has no matching provider.
