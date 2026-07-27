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

Defined in: [packages/devtools/src/selectors.ts:10](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/devtools/src/selectors.ts#L10)

Colour-coded families the MithrilEvent union groups into for an inspector row.
