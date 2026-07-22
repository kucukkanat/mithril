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

Defined in: [packages/core/src/protocol/suspension.ts:40](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/suspension.ts#L40)

A human's decision on a tool-approval suspension.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `I` | The tool input type, for the `'edit'` variant that overrides it. |
