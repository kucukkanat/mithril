---
editUrl: false
next: false
prev: false
title: "replay"
---

```ts
function replay(log, toSeq?): RunState;
```

Defined in: [packages/core/src/protocol/state.ts:216](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/state.ts#L216)

Fold an event log into a [RunState](/mithril/reference/core/protocol/interfaces/runstate/), optionally up to a cursor (time-travel).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `log` | readonly [`MithrilEvent`](/mithril/reference/core/protocol/type-aliases/mithrilevent/)[] | The ordered event log to replay. |
| `toSeq?` | `number` | Inclusive upper bound on `seq`; omit for the final state. |

## Returns

[`RunState`](/mithril/reference/core/protocol/interfaces/runstate/)

The [RunState](/mithril/reference/core/protocol/interfaces/runstate/) after reducing every included event over [INITIAL](/mithril/reference/core/protocol/variables/initial/).

## Example

```ts
const final = replay(log);          // full state
const at5 = replay(log, 5);         // state as of seq <= 5
```
