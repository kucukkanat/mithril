---
editUrl: false
next: false
prev: false
title: "TrajectoryStore"
---

Defined in: index.ts:157

A key→string store for persisted trajectories, backing the record/replay split.

## Remarks

[memoryTrajectoryStore](/reference/evals/functions/memorytrajectorystore/) is the in-memory reference; [fsTrajectoryStore](/reference/evals/functions/fstrajectorystore/) persists to
any Mithril `FileSystem`. Values are the JSON produced by [serializeTrajectory](/reference/evals/functions/serializetrajectory/).

## Methods

### get()

```ts
get(key): Promise<string | undefined>;
```

Defined in: index.ts:158

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

Defined in: index.ts:159

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `value` | `string` |

#### Returns

`Promise`\<`void`\>
