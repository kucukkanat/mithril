---
editUrl: false
next: false
prev: false
title: "openrouterProvider"
---

```ts
function openrouterProvider(config?): Provider;
```

Defined in: openrouter/index.ts:49

Creates an OpenRouter Provider whose `chat` method streams `/chat/completions` responses.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config?` | \{ `baseUrl?`: `string`; `toolSchema?`: `JsonSchemaConverter`; \} & [`OpenRouterAttribution`](/mithril/reference/providers/openrouter/interfaces/openrouterattribution/) | Optional overrides. `baseUrl` replaces the default `https://openrouter.ai/api/v1` endpoint; a `Transport`-supplied `baseUrl` still takes precedence. `toolSchema` is a JsonSchemaConverter for tool parameters (e.g. `z.toJSONSchema` for Zod v4). `appUrl` / `appName` are optional [OpenRouterAttribution](/mithril/reference/providers/openrouter/interfaces/openrouterattribution/). |

## Returns

`Provider`

A Provider bound to OpenRouter.

## Remarks

For the common case prefer the [openrouter](/mithril/reference/providers/openrouter/functions/openrouter/) model-handle factory, which wraps a shared
default-configured instance.

OpenRouter speaks the OpenAI wire format, so this shares OpenAI's request serializer and SSE parser.
Models that expose a reasoning channel stream it as `reasoning`, which surfaces as `reasoning.delta`
chunks ahead of the answer text; when OpenRouter reports a generation `cost`, it lands in the run's
`usage.costMicroUsd`.

With a `byok` transport the call works directly from a browser: OpenRouter serves permissive CORS
(`*`). The key is exposed to the page — fine for a user's own key or local development; use a
`proxy` transport in production.
