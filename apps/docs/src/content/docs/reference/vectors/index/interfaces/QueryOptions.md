---
editUrl: false
next: false
prev: false
title: "QueryOptions"
---

Defined in: [index.ts:28](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/vectors/src/index.ts#L28)

Options for a [VectorStore.query](/reference/vectors/index/interfaces/vectorstore/#query).

## Properties

### filter?

```ts
readonly optional filter?: Readonly<Record<string, unknown>>;
```

Defined in: [index.ts:32](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/vectors/src/index.ts#L32)

Keep only records whose metadata matches every `key: value` pair (shallow equality).

***

### topK?

```ts
readonly optional topK?: number;
```

Defined in: [index.ts:30](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/vectors/src/index.ts#L30)

Maximum matches to return (default 10).
