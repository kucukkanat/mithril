---
editUrl: false
next: false
prev: false
title: "IDLE_SNAPSHOT"
---

```ts
const IDLE_SNAPSHOT: RunSnapshot;
```

Defined in: [index.ts:49](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/react/src/index.ts#L49)

The snapshot for a component with no run yet — an empty transcript. Returned by useRun when its
source is `undefined`, so a component can call the hook unconditionally before a run has started.
