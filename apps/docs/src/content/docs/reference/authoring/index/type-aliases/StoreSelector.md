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

Defined in: [index.ts:92](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/index.ts#L92)

A [ToolStore](/mithril/reference/authoring/persistence/interfaces/toolstore/), or a per-run selector for one.
