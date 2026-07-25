---
editUrl: false
next: false
prev: false
title: "preload"
---

```ts
function preload(modelId, opts?): Promise<void>;
```

Defined in: [transformers/edge.ts:183](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/providers/src/transformers/edge.ts#L183)

Warm the weight cache for a model (and drive `onProgress`) so the first `run()` doesn't stall.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `modelId` | `string` |
| `opts?` | [`EdgeOptions`](/mithril/reference/providers/transformers/interfaces/edgeoptions/) |

## Returns

`Promise`\<`void`\>
