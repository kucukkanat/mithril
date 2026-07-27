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

Defined in: [index.ts:92](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/index.ts#L92)

A [ToolStore](/mithril/reference/authoring/persistence/interfaces/toolstore/), or a per-run selector for one.
