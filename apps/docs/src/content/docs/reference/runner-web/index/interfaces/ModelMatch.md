---
editUrl: false
next: false
prev: false
title: "ModelMatch"
---

Defined in: runner-web/src/model-search.ts:16

A catalog model plus why it ranked where it did.

## Properties

### model

```ts
readonly model: CatalogModel;
```

Defined in: runner-web/src/model-search.ts:17

***

### positions

```ts
readonly positions: readonly number[];
```

Defined in: runner-web/src/model-search.ts:21

Indices into the haystack that the query matched — for highlighting in the UI.

***

### score

```ts
readonly score: number;
```

Defined in: runner-web/src/model-search.ts:19

Higher is better. Only meaningful for ordering within one query's results.
