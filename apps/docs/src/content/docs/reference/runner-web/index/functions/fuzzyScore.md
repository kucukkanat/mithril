---
editUrl: false
next: false
prev: false
title: "fuzzyScore"
---

```ts
function fuzzyScore(query, haystack): number | undefined;
```

Defined in: [runner-web/src/model-search.ts:49](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/model-search.ts#L49)

Score `query` against `haystack` as a case-insensitive subsequence.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `string` | what the user typed; whitespace-insensitive, and an empty query matches everything with score 0. |
| `haystack` | `string` | the string being matched (a model id, or `id + label + note`). |

## Returns

`number` \| `undefined`

the match with its positions, or `undefined` when `query` is not a subsequence of `haystack`.

## Example

```ts
fuzzyScore("s45", "claude-sonnet-4-5")?.score; // > 0 — matches s·4·5
fuzzyScore("zzz", "gpt-4o-mini"); // undefined
```
