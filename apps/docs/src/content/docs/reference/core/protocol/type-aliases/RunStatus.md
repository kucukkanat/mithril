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

Defined in: [packages/core/src/protocol/state.ts:11](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/state.ts#L11)

The lifecycle status of a run derived by the reducer.
