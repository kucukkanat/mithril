---
editUrl: false
next: false
prev: false
title: "StoreSelector"
---

```ts
type StoreSelector = 
  | ToolStore
  | ((ctx) => ToolStore);
```

Defined in: index.ts:92

A [ToolStore](/mithril/reference/authoring/persistence/interfaces/toolstore/), or a per-run selector for one.
