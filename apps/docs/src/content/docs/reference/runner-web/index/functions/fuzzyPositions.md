---
editUrl: false
next: false
prev: false
title: "fuzzyPositions"
---

```ts
function fuzzyPositions(query, haystack): readonly number[];
```

Defined in: runner-web/src/model-search.ts:71

Positions in `haystack` that `query` matched, for highlighting. Empty when there is no match.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `haystack` | `string` |

## Returns

readonly `number`[]
