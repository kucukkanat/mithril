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

Defined in: [packages/core/src/protocol/state.ts:9](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/state.ts#L9)

The lifecycle status of a run derived by the reducer.
