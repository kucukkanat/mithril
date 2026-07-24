---
editUrl: false
next: false
prev: false
title: "VectorStore"
---

Defined in: [index.ts:44](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L44)

A runtime-agnostic vector store (§10.4) — the portable core of retrieval-augmented generation.

## Remarks

Injected into tools via `Deps` (`ctx.deps.vectors`). Implementations must pass [vectorsConformance](/mithril/reference/vectors/index/functions/vectorsconformance/);
[memoryVectorStore](/mithril/reference/vectors/index/functions/memoryvectorstore/) is the reference brute-force impl, with sqlite-vec / pgvector / Vectorize backends
behind per-runtime subpaths. Embeddings are the caller's responsibility (a store persists and searches
vectors; it does not compute them).

## Methods

### delete()

```ts
delete(ids): Promise<void>;
```

Defined in: [index.ts:50](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L50)

Remove records by id; unknown ids are ignored.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ids` | readonly `string`[] |

#### Returns

`Promise`\<`void`\>

***

### query()

```ts
query(vector, opts?): Promise<readonly VectorMatch[]>;
```

Defined in: [index.ts:48](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L48)

Return the nearest records to `vector` by cosine similarity, most similar first.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `vector` | `ArrayLike`\<`number`\> |
| `opts?` | [`QueryOptions`](/mithril/reference/vectors/index/interfaces/queryoptions/) |

#### Returns

`Promise`\<readonly [`VectorMatch`](/mithril/reference/vectors/index/interfaces/vectormatch/)[]\>

***

### size()

```ts
size(): Promise<number>;
```

Defined in: [index.ts:52](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L52)

The number of stored records.

#### Returns

`Promise`\<`number`\>

***

### upsert()

```ts
upsert(records): Promise<void>;
```

Defined in: [index.ts:46](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/vectors/src/index.ts#L46)

Insert or replace records by id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `records` | readonly [`VectorRecord`](/mithril/reference/vectors/index/interfaces/vectorrecord/)[] |

#### Returns

`Promise`\<`void`\>
