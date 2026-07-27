---
editUrl: false
next: false
prev: false
title: "ModelMatch"
---

Defined in: [runner-web/src/model-search.ts:16](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/model-search.ts#L16)

A catalog model plus why it ranked where it did.

## Properties

### model

```ts
readonly model: CatalogModel;
```

Defined in: [runner-web/src/model-search.ts:17](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/model-search.ts#L17)

***

### positions

```ts
readonly positions: readonly number[];
```

Defined in: [runner-web/src/model-search.ts:21](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/model-search.ts#L21)

Indices into the haystack that the query matched — for highlighting in the UI.

***

### score

```ts
readonly score: number;
```

Defined in: [runner-web/src/model-search.ts:19](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/model-search.ts#L19)

Higher is better. Only meaningful for ordering within one query's results.
