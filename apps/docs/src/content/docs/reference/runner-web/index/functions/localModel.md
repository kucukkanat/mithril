---
editUrl: false
next: false
prev: false
title: "localModel"
---

```ts
function localModel(id): 
  | LocalModel
  | undefined;
```

Defined in: [runner-web/src/catalog.ts:113](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L113)

Look up a curated local model by repo id (for its `dtype` pin, size, etc.); `undefined` for free-text ids.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

## Returns

  \| [`LocalModel`](/mithril/reference/runner-web/index/interfaces/localmodel/)
  \| `undefined`
