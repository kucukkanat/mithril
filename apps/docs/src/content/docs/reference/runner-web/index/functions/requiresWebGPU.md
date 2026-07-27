---
editUrl: false
next: false
prev: false
title: "requiresWebGPU"
---

```ts
function requiresWebGPU(model): boolean;
```

Defined in: [runner-web/src/catalog.ts:301](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L301)

True when a model can run **only** on WebGPU — i.e. its [LocalModel.backends](/mithril/reference/runner-web/index/interfaces/localmodel/#backends) is exactly `["webgpu"]`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | \| `string` \| [`LocalModel`](/mithril/reference/runner-web/index/interfaces/localmodel/) |

## Returns

`boolean`
