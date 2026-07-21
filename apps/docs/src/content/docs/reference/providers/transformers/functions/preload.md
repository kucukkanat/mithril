---
editUrl: false
next: false
prev: false
title: "preload"
---

```ts
function preload(modelId, opts?): Promise<void>;
```

Defined in: transformers/edge.ts:124

Warm the weight cache for a model (and drive `onProgress`) so the first `run()` doesn't stall.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `modelId` | `string` |
| `opts?` | [`EdgeOptions`](/reference/providers/transformers/interfaces/edgeoptions/) |

## Returns

`Promise`\<`void`\>
