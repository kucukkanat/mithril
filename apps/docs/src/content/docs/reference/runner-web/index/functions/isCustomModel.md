---
editUrl: false
next: false
prev: false
title: "isCustomModel"
---

```ts
function isCustomModel(
   provider, 
   model, 
   known?): boolean;
```

Defined in: runner-web/src/model-search.ts:124

True when `model` is not in the provider's known list — i.e. an id the user typed themselves, which
is sent to the provider verbatim.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `provider` | [`LiveProviderId`](/mithril/reference/runner-web/index/type-aliases/liveproviderid/) | the provider whose list to check. |
| `model` | `string` | the model id in question. |
| `known?` | readonly [`CatalogModel`](/mithril/reference/runner-web/index/interfaces/catalogmodel/)[] | override the list to check against (pass a live list from [fetchProviderModels](/mithril/reference/runner-web/index/functions/fetchprovidermodels/)). |

## Returns

`boolean`

## Remarks

A custom id is a supported path, not an error state — the picker only uses this to say so
out loud, so a typo is visible before a run fails.
