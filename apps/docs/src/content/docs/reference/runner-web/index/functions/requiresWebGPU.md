---
editUrl: false
next: false
prev: false
title: "requiresWebGPU"
---

```ts
function requiresWebGPU(model): boolean;
```

Defined in: [runner-web/src/catalog.ts:127](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L127)

True when a model can run **only** on WebGPU — i.e. its [LocalModel.backends](/mithril/reference/runner-web/index/interfaces/localmodel/#backends) is exactly `["webgpu"]`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | \| `string` \| [`LocalModel`](/mithril/reference/runner-web/index/interfaces/localmodel/) |

## Returns

`boolean`
