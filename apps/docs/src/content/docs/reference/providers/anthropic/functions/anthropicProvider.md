---
editUrl: false
next: false
prev: false
title: "anthropicProvider"
---

```ts
function anthropicProvider(config?): Provider;
```

Defined in: [anthropic/index.ts:83](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/providers/src/anthropic/index.ts#L83)

Creates an Anthropic Provider whose `chat` method streams `/messages` responses.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config?` | \{ `baseUrl?`: `string`; `toolSchema?`: `JsonSchemaConverter`; \} | Optional overrides. `baseUrl` replaces the default `https://api.anthropic.com/v1` endpoint; a `Transport`-supplied `baseUrl` still takes precedence. Requests are pinned to API version `2023-06-01` and sent with `max_tokens: 4096`. |
| `config.baseUrl?` | `string` | - |
| `config.toolSchema?` | `JsonSchemaConverter` | - |

## Returns

`Provider`

A Provider bound to the Anthropic wire format.

## Remarks

Use this when you need a provider configured for a custom endpoint. For the common case, prefer the
[anthropic](/reference/providers/anthropic/functions/anthropic/) model-handle factory, which wraps a shared default-configured instance.

Tool parameters are converted via toJsonSchema: precise `input_schema` when the tool's input
schema self-describes (see `withJsonSchema`) or a `toolSchema` converter is supplied, permissive
`{ type: "object" }` otherwise.

With a `byok` transport the provider auto-injects the `anthropic-dangerous-direct-browser-access: true`
header, since Anthropic serves CORS only behind that explicit opt-in — so a browser BYOK call works
without the consumer wiring the header themselves. The key is exposed to the page; use a `proxy`
transport in production.
