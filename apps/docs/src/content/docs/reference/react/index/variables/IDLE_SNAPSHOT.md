---
editUrl: false
next: false
prev: false
title: "IDLE_SNAPSHOT"
---

```ts
const IDLE_SNAPSHOT: RunSnapshot;
```

Defined in: [index.ts:49](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/react/src/index.ts#L49)

The snapshot for a component with no run yet — an empty transcript. Returned by useRun when its
source is `undefined`, so a component can call the hook unconditionally before a run has started.
