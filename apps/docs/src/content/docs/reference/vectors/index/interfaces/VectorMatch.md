---
editUrl: false
next: false
prev: false
title: "VectorMatch"
---

Defined in: [index.ts:20](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/vectors/src/index.ts#L20)

A single nearest-neighbour hit returned by [VectorStore.query](/mithril/reference/vectors/index/interfaces/vectorstore/#query), ordered by descending `score`.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [index.ts:21](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/vectors/src/index.ts#L21)

***

### metadata?

```ts
readonly optional metadata?: Readonly<Record<string, unknown>>;
```

Defined in: [index.ts:24](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/vectors/src/index.ts#L24)

***

### score

```ts
readonly score: number;
```

Defined in: [index.ts:23](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/vectors/src/index.ts#L23)

Cosine similarity in `[-1, 1]`; higher is more similar.
