---
editUrl: false
next: false
prev: false
title: "resolveTransport"
---

```ts
function resolveTransport(explicit, modelId): Transport;
```

Defined in: [packages/core/src/agent/registry.ts:108](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/registry.ts#L108)

Resolve the [Transport](/mithril/reference/core/protocol/type-aliases/transport/) for a run, defaulting to BYOK from the environment.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `explicit` | \| [`Transport`](/mithril/reference/core/protocol/type-aliases/transport/) \| `undefined` | a caller-supplied transport; returned unchanged when present. |
| `modelId` | `` `${string}/${string}` `` | the resolved model id; its `provider` segment selects the `<PROVIDER>_API_KEY` and `<PROVIDER>_BASE_URL` env vars. |

## Returns

[`Transport`](/mithril/reference/core/protocol/type-aliases/transport/)

the explicit transport, or a `byok` transport reading `<PROVIDER>_API_KEY` (empty string if
  unset) and, when set, `<PROVIDER>_BASE_URL`.

## Remarks

`<PROVIDER>_BASE_URL` points a provider at a wire-compatible endpoint — a gateway, a proxy,
a local server — without touching the code. It is the environment half of the same override
`openaiProvider({ baseUrl })` / `anthropicProvider({ baseUrl })` take in code; an explicit
`transport` still wins, since it is the more specific instruction.

## Example

```sh
OPENAI_API_KEY=… OPENAI_BASE_URL=https://my-gateway.internal/v1 bun run start
```
