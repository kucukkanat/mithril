---
editUrl: false
next: false
prev: false
title: "reduce"
---

```ts
function reduce(state, e): RunState;
```

Defined in: [packages/core/src/protocol/state.ts:230](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/state.ts#L230)

Apply one [MithrilEvent](/mithril/reference/core/protocol/type-aliases/mithrilevent/) to a [RunState](/mithril/reference/core/protocol/interfaces/runstate/), returning the next state.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `state` | [`RunState`](/mithril/reference/core/protocol/interfaces/runstate/) | The current run state (start from [INITIAL](/mithril/reference/core/protocol/variables/initial/)). |
| `e` | [`MithrilEvent`](/mithril/reference/core/protocol/type-aliases/mithrilevent/) | The next event to fold in. |

## Returns

[`RunState`](/mithril/reference/core/protocol/interfaces/runstate/)

A new [RunState](/mithril/reference/core/protocol/interfaces/runstate/); the input is never mutated.

## Remarks

Pure and total — an unrecognized `type` is inert (state stays the log). The
event is routed to its owning run via the `span` tree: a sub-run is opened by
a `run.start` whose span has a non-null `parentId`, and its lifecycle accrues
under [RunState.subruns](/mithril/reference/core/protocol/interfaces/runstate/#subruns) rather than the root. Arbitrary nesting
resolves in a single forward pass because a span always opens before events
reference it (`seq` is monotonic).

## Example

```ts
const next = reduce(INITIAL, event);
const state = log.reduce(reduce, INITIAL); // == replay(log)
```
