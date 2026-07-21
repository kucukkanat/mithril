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

Defined in: packages/devtools/src/selectors.ts:10

Colour-coded families the MithrilEvent union groups into for an inspector row.
