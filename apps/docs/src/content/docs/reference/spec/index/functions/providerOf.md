---
editUrl: false
next: false
prev: false
title: "providerOf"
---

```ts
function providerOf(model): "openai" | "anthropic" | "google" | "groq" | "transformers" | undefined;
```

Defined in: [packages/spec/src/codegen.ts:45](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/codegen.ts#L45)

The provider-import token a model needs (for import planning), or `undefined` for a verbatim `code` model.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | [`ModelSpec`](/reference/spec/index/type-aliases/modelspec/) |

## Returns

`"openai"` \| `"anthropic"` \| `"google"` \| `"groq"` \| `"transformers"` \| `undefined`
