---
editUrl: false
next: false
prev: false
title: "WorkflowRoute"
---

```ts
type WorkflowRoute = 
  | {
  goto: string;
}
  | {
  done: true;
};
```

Defined in: packages/spec/src/types.ts:100

Where a workflow step routes next.
