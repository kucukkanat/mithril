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

Defined in: [packages/core/src/protocol/state.ts:9](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/state.ts#L9)

The lifecycle status of a run derived by the reducer.
