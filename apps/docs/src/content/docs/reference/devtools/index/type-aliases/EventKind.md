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

Defined in: [packages/devtools/src/selectors.ts:10](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/devtools/src/selectors.ts#L10)

Colour-coded families the MithrilEvent union groups into for an inspector row.
