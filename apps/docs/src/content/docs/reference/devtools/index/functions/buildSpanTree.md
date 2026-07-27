---
editUrl: false
next: false
prev: false
title: "buildSpanTree"
---

```ts
function buildSpanTree(events): readonly SpanNode[];
```

Defined in: [packages/devtools/src/selectors.ts:100](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/devtools/src/selectors.ts#L100)

Group a run's events into a tree of spans by their `span.parentId`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `events` | readonly `MithrilEvent`[] | the run's event log (in `seq` order). |

## Returns

readonly [`SpanNode`](/mithril/reference/devtools/index/interfaces/spannode/)[]

the root [SpanNode](/mithril/reference/devtools/index/interfaces/spannode/)s (spans with no parent, or whose parent is absent from the log), each
carrying its own events and nested child spans — so nested `asTool`/handoff sub-runs render as sub-trees.

## Remarks

Pure: the tree is derived entirely from `e.span`. First-seen order is preserved among siblings.
