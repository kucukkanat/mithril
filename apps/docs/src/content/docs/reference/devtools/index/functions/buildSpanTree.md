---
editUrl: false
next: false
prev: false
title: "buildSpanTree"
---

```ts
function buildSpanTree(events): readonly SpanNode[];
```

Defined in: [packages/devtools/src/selectors.ts:96](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/devtools/src/selectors.ts#L96)

Group a run's events into a tree of spans by their `span.parentId`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `events` | readonly `MithrilEvent`[] | the run's event log (in `seq` order). |

## Returns

readonly [`SpanNode`](/reference/devtools/index/interfaces/spannode/)[]

the root [SpanNode](/reference/devtools/index/interfaces/spannode/)s (spans with no parent, or whose parent is absent from the log), each
carrying its own events and nested child spans — so nested `asTool`/handoff sub-runs render as sub-trees.

## Remarks

Pure: the tree is derived entirely from `e.span`. First-seen order is preserved among siblings.
