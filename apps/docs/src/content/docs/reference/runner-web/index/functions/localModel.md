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

Defined in: [runner-web/src/catalog.ts:287](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/runner-web/src/catalog.ts#L287)

Look up a curated local model by repo id (for its `dtype` pin, size, etc.); `undefined` for free-text ids.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

## Returns

  \| [`LocalModel`](/mithril/reference/runner-web/index/interfaces/localmodel/)
  \| `undefined`
