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

Defined in: [packages/core/src/agent/registry.ts:75](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/agent/registry.ts#L75)

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
