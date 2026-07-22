---
editUrl: false
next: false
prev: false
title: "VectorRecord"
---

Defined in: [index.ts:13](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/vectors/src/index.ts#L13)

A record written to a [VectorStore](/reference/vectors/index/interfaces/vectorstore/): an id, its embedding, and optional JSON-safe metadata.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [index.ts:14](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/vectors/src/index.ts#L14)

***

### metadata?

```ts
readonly optional metadata?: Readonly<Record<string, unknown>>;
```

Defined in: [index.ts:16](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/vectors/src/index.ts#L16)

***

### vector

```ts
readonly vector: ArrayLike<number>;
```

Defined in: [index.ts:15](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/vectors/src/index.ts#L15)
