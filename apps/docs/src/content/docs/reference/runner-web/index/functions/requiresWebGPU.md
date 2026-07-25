---
editUrl: false
next: false
prev: false
title: "requiresWebGPU"
---

```ts
function requiresWebGPU(model): boolean;
```

Defined in: [runner-web/src/catalog.ts:127](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/runner-web/src/catalog.ts#L127)

True when a model can run **only** on WebGPU — i.e. its [LocalModel.backends](/mithril/reference/runner-web/index/interfaces/localmodel/#backends) is exactly `["webgpu"]`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | \| `string` \| [`LocalModel`](/mithril/reference/runner-web/index/interfaces/localmodel/) |

## Returns

`boolean`
