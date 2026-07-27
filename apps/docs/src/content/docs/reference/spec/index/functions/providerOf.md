---
editUrl: false
next: false
prev: false
title: "providerOf"
---

```ts
function providerOf(model): 
  | LiveProviderName
  | "transformers"
  | undefined;
```

Defined in: [packages/spec/src/codegen.ts:46](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/codegen.ts#L46)

The provider-import token a model needs (for import planning), or `undefined` for a verbatim `code` model.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | [`ModelSpec`](/mithril/reference/spec/index/type-aliases/modelspec/) |

## Returns

  \| [`LiveProviderName`](/mithril/reference/spec/index/type-aliases/liveprovidername/)
  \| `"transformers"`
  \| `undefined`
