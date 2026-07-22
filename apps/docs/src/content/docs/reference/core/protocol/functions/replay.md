---
editUrl: false
next: false
prev: false
title: "replay"
---

```ts
function replay(log, toSeq?): RunState;
```

Defined in: [packages/core/src/protocol/state.ts:216](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/state.ts#L216)

Fold an event log into a [RunState](/reference/core/protocol/interfaces/runstate/), optionally up to a cursor (time-travel).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `log` | readonly [`MithrilEvent`](/reference/core/protocol/type-aliases/mithrilevent/)[] | The ordered event log to replay. |
| `toSeq?` | `number` | Inclusive upper bound on `seq`; omit for the final state. |

## Returns

[`RunState`](/reference/core/protocol/interfaces/runstate/)

The [RunState](/reference/core/protocol/interfaces/runstate/) after reducing every included event over [INITIAL](/reference/core/protocol/variables/initial/).

## Example

```ts
const final = replay(log);          // full state
const at5 = replay(log, 5);         // state as of seq <= 5
```
