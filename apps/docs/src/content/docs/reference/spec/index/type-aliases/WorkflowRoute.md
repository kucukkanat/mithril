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

Defined in: [packages/spec/src/types.ts:97](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L97)

Where a workflow step routes next.
