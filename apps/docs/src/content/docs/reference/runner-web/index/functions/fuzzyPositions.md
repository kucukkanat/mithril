---
editUrl: false
next: false
prev: false
title: "fuzzyPositions"
---

```ts
function fuzzyPositions(query, haystack): readonly number[];
```

Defined in: [runner-web/src/model-search.ts:71](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/model-search.ts#L71)

Positions in `haystack` that `query` matched, for highlighting. Empty when there is no match.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `haystack` | `string` |

## Returns

readonly `number`[]
