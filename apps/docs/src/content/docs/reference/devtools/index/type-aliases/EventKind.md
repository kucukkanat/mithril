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

Defined in: [packages/devtools/src/selectors.ts:10](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/devtools/src/selectors.ts#L10)

Colour-coded families the MithrilEvent union groups into for an inspector row.
