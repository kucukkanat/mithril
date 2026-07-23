---
editUrl: false
next: false
prev: false
title: "EventKind"
---

```ts
type EventKind = 
  | "lifecycle"
  | "text"
  | "tool"
  | "toolResult"
  | "object"
  | "control"
  | "meta"
  | "error"
  | "custom";
```

Defined in: [packages/devtools/src/selectors.ts:10](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/devtools/src/selectors.ts#L10)

Colour-coded families the MithrilEvent union groups into for an inspector row.
