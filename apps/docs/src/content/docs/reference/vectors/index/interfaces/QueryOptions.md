---
editUrl: false
next: false
prev: false
title: "QueryOptions"
---

Defined in: [index.ts:28](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L28)

Options for a [VectorStore.query](/mithril/reference/vectors/index/interfaces/vectorstore/#query).

## Properties

### filter?

```ts
readonly optional filter?: Readonly<Record<string, unknown>>;
```

Defined in: [index.ts:32](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L32)

Keep only records whose metadata matches every `key: value` pair (shallow equality).

***

### topK?

```ts
readonly optional topK?: number;
```

Defined in: [index.ts:30](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L30)

Maximum matches to return (default 10).
