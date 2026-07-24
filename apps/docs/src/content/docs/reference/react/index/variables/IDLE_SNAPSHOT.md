---
editUrl: false
next: false
prev: false
title: "IDLE_SNAPSHOT"
---

```ts
const IDLE_SNAPSHOT: RunSnapshot;
```

Defined in: [index.ts:49](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/react/src/index.ts#L49)

The snapshot for a component with no run yet — an empty transcript. Returned by useRun when its
source is `undefined`, so a component can call the hook unconditionally before a run has started.
