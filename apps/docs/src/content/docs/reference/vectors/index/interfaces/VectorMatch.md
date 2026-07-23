---
editUrl: false
next: false
prev: false
title: "VectorMatch"
---

Defined in: [index.ts:20](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/vectors/src/index.ts#L20)

A single nearest-neighbour hit returned by [VectorStore.query](/reference/vectors/index/interfaces/vectorstore/#query), ordered by descending `score`.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [index.ts:21](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/vectors/src/index.ts#L21)

***

### metadata?

```ts
readonly optional metadata?: Readonly<Record<string, unknown>>;
```

Defined in: [index.ts:24](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/vectors/src/index.ts#L24)

***

### score

```ts
readonly score: number;
```

Defined in: [index.ts:23](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/vectors/src/index.ts#L23)

Cosine similarity in `[-1, 1]`; higher is more similar.
