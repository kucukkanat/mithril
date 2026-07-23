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

Defined in: [packages/core/src/protocol/state.ts:9](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/state.ts#L9)

The lifecycle status of a run derived by the reducer.
