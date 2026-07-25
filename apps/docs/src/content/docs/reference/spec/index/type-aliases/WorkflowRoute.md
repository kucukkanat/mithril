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

Defined in: [packages/spec/src/types.ts:97](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/spec/src/types.ts#L97)

Where a workflow step routes next.
