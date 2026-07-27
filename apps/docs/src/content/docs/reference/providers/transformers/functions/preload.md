---
editUrl: false
next: false
prev: false
title: "preload"
---

```ts
function preload(modelId, opts?): Promise<void>;
```

Defined in: [transformers/edge.ts:184](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/edge.ts#L184)

Warm the weight cache for a model (and drive `onProgress`) so the first `run()` doesn't stall.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `modelId` | `string` |
| `opts?` | [`EdgeOptions`](/mithril/reference/providers/transformers/interfaces/edgeoptions/) |

## Returns

`Promise`\<`void`\>
