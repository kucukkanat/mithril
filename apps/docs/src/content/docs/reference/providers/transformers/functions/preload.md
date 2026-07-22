---
editUrl: false
next: false
prev: false
title: "preload"
---

```ts
function preload(modelId, opts?): Promise<void>;
```

Defined in: [transformers/edge.ts:124](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/edge.ts#L124)

Warm the weight cache for a model (and drive `onProgress`) so the first `run()` doesn't stall.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `modelId` | `string` |
| `opts?` | [`EdgeOptions`](/reference/providers/transformers/interfaces/edgeoptions/) |

## Returns

`Promise`\<`void`\>
