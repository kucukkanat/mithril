---
editUrl: false
next: false
prev: false
title: "providerOf"
---

```ts
function providerOf(model): "openai" | "anthropic" | "google" | "groq" | "transformers" | undefined;
```

Defined in: [packages/spec/src/codegen.ts:45](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/spec/src/codegen.ts#L45)

The provider-import token a model needs (for import planning), or `undefined` for a verbatim `code` model.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | [`ModelSpec`](/mithril/reference/spec/index/type-aliases/modelspec/) |

## Returns

`"openai"` \| `"anthropic"` \| `"google"` \| `"groq"` \| `"transformers"` \| `undefined`
