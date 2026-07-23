---
editUrl: false
next: false
prev: false
title: "IDLE_SNAPSHOT"
---

```ts
const IDLE_SNAPSHOT: RunSnapshot;
```

Defined in: [index.ts:49](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/react/src/index.ts#L49)

The snapshot for a component with no run yet — an empty transcript. Returned by useRun when its
source is `undefined`, so a component can call the hook unconditionally before a run has started.
