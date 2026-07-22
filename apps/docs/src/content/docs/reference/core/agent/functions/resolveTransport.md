---
editUrl: false
next: false
prev: false
title: "resolveTransport"
---

```ts
function resolveTransport(explicit, modelId): Transport;
```

Defined in: [packages/core/src/agent/registry.ts:96](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/agent/registry.ts#L96)

Resolve the [Transport](/reference/core/protocol/type-aliases/transport/) for a run, defaulting to BYOK from the environment.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `explicit` | \| [`Transport`](/reference/core/protocol/type-aliases/transport/) \| `undefined` | a caller-supplied transport; returned unchanged when present. |
| `modelId` | `` `${string}/${string}` `` | the resolved model id; its `provider` segment selects the `<PROVIDER>_API_KEY` env var. |

## Returns

[`Transport`](/reference/core/protocol/type-aliases/transport/)

the explicit transport, or a `byok` transport reading `<PROVIDER>_API_KEY` (empty string if unset).
