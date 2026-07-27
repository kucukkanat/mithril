---
editUrl: false
next: false
prev: false
title: "replay"
---

```ts
function replay(log, toSeq?): RunState;
```

Defined in: [packages/core/src/protocol/state.ts:270](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/state.ts#L270)

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
