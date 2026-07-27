---
editUrl: false
next: false
prev: false
title: "toMediaSource"
---

```ts
function toMediaSource(source, fallbackMediaType?): MediaSource;
```

Defined in: [packages/core/src/protocol/content.ts:62](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/content.ts#L62)

Resolve a normalized source string into a provider-ready form: a `data:` URL splits into `{ base64,
mediaType }`; an `http(s):` URL stays a URL. Providers that inline bytes (Anthropic, Google) use the base64
branch; providers that accept a URL directly (OpenAI `image_url`) can pass the string through.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `string` |
| `fallbackMediaType?` | `string` |

## Returns

[`MediaSource`](/mithril/reference/core/protocol/type-aliases/mediasource/)
