---
editUrl: false
next: false
prev: false
title: "modelBackends"
---

```ts
function modelBackends(model): readonly Backend[];
```

Defined in: [runner-web/src/catalog.ts:295](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L295)

The backends a model may run on: its declared [LocalModel.backends](/mithril/reference/runner-web/index/interfaces/localmodel/#backends), or [ALL\_BACKENDS](/mithril/reference/runner-web/index/variables/all_backends/) when
unrestricted. Accepts a [LocalModel](/mithril/reference/runner-web/index/interfaces/localmodel/) or a bare repo id (unknown/free-text ids ⇒ all backends).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | \| `string` \| [`LocalModel`](/mithril/reference/runner-web/index/interfaces/localmodel/) |

## Returns

readonly [`Backend`](/mithril/reference/runner-web/index/type-aliases/backend/)[]
