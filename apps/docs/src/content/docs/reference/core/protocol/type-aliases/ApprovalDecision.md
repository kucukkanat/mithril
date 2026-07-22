---
editUrl: false
next: false
prev: false
title: "ApprovalDecision"
---

```ts
type ApprovalDecision<I> = 
  | {
  kind: "approve";
}
  | {
  kind: "reject";
  message: string;
}
  | {
  input: I;
  kind: "edit";
};
```

Defined in: [packages/core/src/protocol/suspension.ts:40](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/suspension.ts#L40)

A human's decision on a tool-approval suspension.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `I` | The tool input type, for the `'edit'` variant that overrides it. |
