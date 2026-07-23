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

Defined in: [runner-web/src/catalog.ts:84](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/runner-web/src/catalog.ts#L84)

Look up a curated local model by repo id (for its `dtype` pin, size, etc.); `undefined` for free-text ids.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

## Returns

  \| [`LocalModel`](/reference/runner-web/index/interfaces/localmodel/)
  \| `undefined`
