---
editUrl: false
next: false
prev: false
title: "BestOfNOptions"
---

Defined in: [packages/core/src/agent/test-time.ts:72](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/test-time.ts#L72)

Options for [bestOfN](/reference/core/agent/functions/bestofn/).

## Properties

### n

```ts
readonly n: number;
```

Defined in: [packages/core/src/agent/test-time.ts:74](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/test-time.ts#L74)

How many candidates to draw.

***

### score

```ts
readonly score: (r) => number | Promise<number>;
```

Defined in: [packages/core/src/agent/test-time.ts:76](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/test-time.ts#L76)

Score a candidate; higher wins. A deterministic verifier (parse/execute success) is the ideal scorer.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `r` | [`ModelResult`](/reference/core/protocol/interfaces/modelresult/) |

#### Returns

`number` \| `Promise`\<`number`\>

***

### threshold?

```ts
readonly optional threshold?: number;
```

Defined in: [packages/core/src/agent/test-time.ts:78](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/test-time.ts#L78)

Stop early and take the first candidate scoring at least this. Omit to always draw all `n`.
