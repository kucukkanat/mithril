---
editUrl: false
next: false
prev: false
title: "TrajectoryStore"
---

Defined in: [index.ts:183](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L183)

A key→string store for persisted trajectories, backing the record/replay split.

## Remarks

[memoryTrajectoryStore](/reference/evals/functions/memorytrajectorystore/) is the in-memory reference; [fsTrajectoryStore](/reference/evals/functions/fstrajectorystore/) persists to
any Mithril `FileSystem`. Values are the JSON produced by [serializeTrajectory](/reference/evals/functions/serializetrajectory/).

## Methods

### get()

```ts
get(key): Promise<string | undefined>;
```

Defined in: [index.ts:184](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L184)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

`Promise`\<`string` \| `undefined`\>

***

### put()

```ts
put(key, value): Promise<void>;
```

Defined in: [index.ts:185](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L185)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `value` | `string` |

#### Returns

`Promise`\<`void`\>
