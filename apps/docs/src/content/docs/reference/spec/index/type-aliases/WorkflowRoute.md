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

Defined in: [packages/spec/src/types.ts:103](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L103)

Where a workflow step routes next.
