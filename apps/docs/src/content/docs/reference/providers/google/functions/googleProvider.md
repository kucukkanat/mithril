---
editUrl: false
next: false
prev: false
title: "googleProvider"
---

```ts
function googleProvider(config?): Provider;
```

Defined in: [google/index.ts:109](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/google/index.ts#L109)

Creates a Google Gemini Provider whose `chat` method streams `:streamGenerateContent` responses.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config?` | \{ `baseUrl?`: `string`; `toolSchema?`: `JsonSchemaConverter`; \} | Optional overrides. `baseUrl` replaces the default `https://generativelanguage.googleapis.com/v1beta` endpoint; a `Transport`-supplied `baseUrl` still takes precedence. |
| `config.baseUrl?` | `string` | - |
| `config.toolSchema?` | `JsonSchemaConverter` | - |

## Returns

`Provider`

A Provider bound to the Gemini wire format.

## Remarks

Use this when you need a provider configured for a custom endpoint. For the common case, prefer the
[google](/mithril/reference/providers/google/functions/google/) model-handle factory, which wraps a shared default-configured instance.

The API key is passed as a `?key=` query parameter (Gemini's scheme), read from a `byok` transport's
`apiKey` or an `ephemeral` transport's `token()`. Tool parameters are converted via toJsonSchema:
precise when the input schema self-describes (see `withJsonSchema`) or a `toolSchema` converter is
supplied, permissive `{ type: "object" }` otherwise. Finish reasons are mapped as `MAX_TOKENS` →
`length`, `SAFETY` → `content_filter`, everything else → `stop`.
