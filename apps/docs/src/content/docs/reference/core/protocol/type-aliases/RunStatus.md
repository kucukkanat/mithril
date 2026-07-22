---
editUrl: false
next: false
prev: false
title: "RunStatus"
---

```ts
type RunStatus = 
  | "running"
  | "suspended"
  | "unresumable"
  | "completed"
  | "cancelled"
  | "error";
```

Defined in: [packages/core/src/protocol/state.ts:9](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/state.ts#L9)

The lifecycle status of a run derived by the reducer.
