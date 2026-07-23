---
editUrl: false
next: false
prev: false
title: "VectorRecord"
---

Defined in: [index.ts:13](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/vectors/src/index.ts#L13)

A record written to a [VectorStore](/reference/vectors/index/interfaces/vectorstore/): an id, its embedding, and optional JSON-safe metadata.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [index.ts:14](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/vectors/src/index.ts#L14)

***

### metadata?

```ts
readonly optional metadata?: Readonly<Record<string, unknown>>;
```

Defined in: [index.ts:16](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/vectors/src/index.ts#L16)

***

### vector

```ts
readonly vector: ArrayLike<number>;
```

Defined in: [index.ts:15](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/vectors/src/index.ts#L15)
