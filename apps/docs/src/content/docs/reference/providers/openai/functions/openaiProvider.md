---
editUrl: false
next: false
prev: false
title: "openaiProvider"
---

```ts
function openaiProvider(config?): Provider;
```

Defined in: openai/index.ts:62

Creates an OpenAI Provider whose `chat` method streams `/chat/completions` responses.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config?` | \{ `baseUrl?`: `string`; `toolSchema?`: `JsonSchemaConverter`; \} | Optional overrides. `baseUrl` replaces the default `https://api.openai.com/v1` endpoint (e.g. to target an OpenAI-compatible gateway); a `Transport`-supplied `baseUrl` still takes precedence. `toolSchema` is a JsonSchemaConverter for tool parameters (e.g. `z.toJSONSchema` for Zod v4). |
| `config.baseUrl?` | `string` | - |
| `config.toolSchema?` | `JsonSchemaConverter` | - |

## Returns

`Provider`

A Provider bound to the OpenAI wire format.

## Remarks

Use this when you need a provider configured for a custom endpoint. For the common case, prefer the
[openai](/reference/providers/openai/functions/openai/) model-handle factory, which wraps a shared default-configured instance.

Tool parameters are converted via toJsonSchema: precise when the input schema self-describes
(see `withJsonSchema`) or a `toolSchema` converter is supplied, and a permissive `{ type: "object" }`
otherwise.

With a `byok` transport the call works directly from a browser: OpenAI serves permissive CORS (`*`)
unconditionally, so no extra header is injected. The key is exposed to the page — fine for a user's own
key or local development; use a `proxy` transport in production.
