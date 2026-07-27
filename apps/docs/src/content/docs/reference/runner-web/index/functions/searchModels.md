---
editUrl: false
next: false
prev: false
title: "searchModels"
---

```ts
function searchModels(models, query): readonly ModelMatch[];
```

Defined in: runner-web/src/model-search.ts:98

Rank `models` against a query, best first.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `models` | readonly [`CatalogModel`](/mithril/reference/runner-web/index/interfaces/catalogmodel/)[] | the candidate list — a provider's [LiveProvider.models](/mithril/reference/runner-web/index/interfaces/liveprovider/#models), or a live list from [fetchProviderModels](/mithril/reference/runner-web/index/functions/fetchprovidermodels/). |
| `query` | `string` | the user's search text. Empty returns the list unchanged (catalog order is curated). |

## Returns

readonly [`ModelMatch`](/mithril/reference/runner-web/index/interfaces/modelmatch/)[]

the matching models, best first. Non-matches are dropped.

## Example

```ts
searchModels(liveProvider("anthropic").models, "haiku")[0]?.model.id; // "claude-haiku-4-5"
```
