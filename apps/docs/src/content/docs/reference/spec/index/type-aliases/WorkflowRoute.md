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

Defined in: [packages/spec/src/types.ts:97](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L97)

Where a workflow step routes next.
