---
editUrl: false
next: false
prev: false
title: "Checkpointer"
---

Defined in: [packages/core/src/protocol/checkpointer.ts:33](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/checkpointer.ts#L33)

The persistence contract for durable runs.

## Remarks

The interface and conformance kit ship in core; concrete durable
implementations live in `@mithril/memory` behind per-runtime subpaths.
`put` is optimistic-concurrency aware via `opts.ifParent`, returning
`'conflict'` when the expected parent does not match.

## Methods

### get()

```ts
get(runId, checkpointId): Promise<
  | CheckpointRecord
| undefined>;
```

Defined in: [packages/core/src/protocol/checkpointer.ts:36](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/checkpointer.ts#L36)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `checkpointId` | `string` |

#### Returns

`Promise`\<
  \| [`CheckpointRecord`](/mithril/reference/core/protocol/interfaces/checkpointrecord/)
  \| `undefined`\>

***

### history()

```ts
history(runId): AsyncIterable<CheckpointRecord>;
```

Defined in: [packages/core/src/protocol/checkpointer.ts:37](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/checkpointer.ts#L37)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`AsyncIterable`\<[`CheckpointRecord`](/mithril/reference/core/protocol/interfaces/checkpointrecord/)\>

***

### latest()

```ts
latest(runId): Promise<
  | CheckpointRecord
| undefined>;
```

Defined in: [packages/core/src/protocol/checkpointer.ts:35](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/checkpointer.ts#L35)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`Promise`\<
  \| [`CheckpointRecord`](/mithril/reference/core/protocol/interfaces/checkpointrecord/)
  \| `undefined`\>

***

### purge()

```ts
purge(runId): Promise<void>;
```

Defined in: [packages/core/src/protocol/checkpointer.ts:38](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/checkpointer.ts#L38)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`Promise`\<`void`\>

***

### put()

```ts
put(rec, opts?): Promise<"ok" | "conflict">;
```

Defined in: [packages/core/src/protocol/checkpointer.ts:34](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/checkpointer.ts#L34)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rec` | [`CheckpointRecord`](/mithril/reference/core/protocol/interfaces/checkpointrecord/) |
| `opts?` | \{ `ifParent?`: `string` \| `null`; \} |
| `opts.ifParent?` | `string` \| `null` |

#### Returns

`Promise`\<`"ok"` \| `"conflict"`\>
