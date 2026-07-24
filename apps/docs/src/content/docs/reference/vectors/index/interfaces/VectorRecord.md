---
editUrl: false
next: false
prev: false
title: "VectorRecord"
---

Defined in: [index.ts:13](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L13)

A record written to a [VectorStore](/mithril/reference/vectors/index/interfaces/vectorstore/): an id, its embedding, and optional JSON-safe metadata.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [index.ts:14](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L14)

***

### metadata?

```ts
readonly optional metadata?: Readonly<Record<string, unknown>>;
```

Defined in: [index.ts:16](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L16)

***

### vector

```ts
readonly vector: ArrayLike<number>;
```

Defined in: [index.ts:15](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L15)
