---
editUrl: false
next: false
prev: false
title: "requiresWebGPU"
---

```ts
function requiresWebGPU(model): boolean;
```

Defined in: [runner-web/src/catalog.ts:301](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/runner-web/src/catalog.ts#L301)

True when a model can run **only** on WebGPU — i.e. its [LocalModel.backends](/mithril/reference/runner-web/index/interfaces/localmodel/#backends) is exactly `["webgpu"]`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | \| `string` \| [`LocalModel`](/mithril/reference/runner-web/index/interfaces/localmodel/) |

## Returns

`boolean`
