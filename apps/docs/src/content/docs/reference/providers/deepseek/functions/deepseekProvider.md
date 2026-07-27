---
editUrl: false
next: false
prev: false
title: "deepseekProvider"
---

```ts
function deepseekProvider(config?): Provider;
```

Defined in: deepseek/index.ts:34

Creates a DeepSeek Provider whose `chat` method streams `/chat/completions` responses.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config?` | \{ `baseUrl?`: `string`; `toolSchema?`: `JsonSchemaConverter`; \} | Optional overrides. `baseUrl` replaces the default `https://api.deepseek.com` endpoint; a `Transport`-supplied `baseUrl` still takes precedence. `toolSchema` is a JsonSchemaConverter for tool parameters (e.g. `z.toJSONSchema` for Zod v4). |
| `config.baseUrl?` | `string` | - |
| `config.toolSchema?` | `JsonSchemaConverter` | - |

## Returns

`Provider`

A Provider bound to DeepSeek.

## Remarks

For the common case prefer the [deepseek](/mithril/reference/providers/deepseek/functions/deepseek/) model-handle factory, which wraps a shared
default-configured instance.

DeepSeek speaks the OpenAI wire format, so this shares OpenAI's request serializer and SSE parser.
`deepseek-reasoner` additionally streams a `reasoning_content` channel, which surfaces as
`reasoning.delta` chunks (`reasoning` events on the public stream) ahead of the answer text.

With a `byok` transport the call works directly from a browser: DeepSeek reflects the request origin
in `access-control-allow-origin` and permits the `authorization` header. The key is exposed to the
page — fine for a user's own key or local development; use a `proxy` transport in production.
