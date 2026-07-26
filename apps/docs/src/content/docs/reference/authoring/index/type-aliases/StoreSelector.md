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

Defined in: [index.ts:92](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/authoring/src/index.ts#L92)

A [ToolStore](/mithril/reference/authoring/persistence/interfaces/toolstore/), or a per-run selector for one.
