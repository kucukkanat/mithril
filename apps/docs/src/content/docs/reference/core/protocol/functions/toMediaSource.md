---
editUrl: false
next: false
prev: false
title: "toMediaSource"
---

```ts
function toMediaSource(source, fallbackMediaType?): MediaSource;
```

Defined in: [packages/core/src/protocol/content.ts:62](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/content.ts#L62)

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
