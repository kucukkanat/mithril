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

Defined in: [packages/core/src/protocol/suspension.ts:40](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/suspension.ts#L40)

A human's decision on a tool-approval suspension.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `I` | The tool input type, for the `'edit'` variant that overrides it. |
