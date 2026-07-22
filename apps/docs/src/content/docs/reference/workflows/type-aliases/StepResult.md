---
editUrl: false
next: false
prev: false
title: "StepResult"
---

```ts
type StepResult<S> = 
  | {
  goto: string;
  state: S;
}
  | {
  done: true;
  state: S;
};
```

Defined in: [packages/workflows/src/index.ts:13](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/workflows/src/index.ts#L13)

What a [WorkflowStep](/reference/workflows/type-aliases/workflowstep/) returns: either route to another step (`goto`) or finish (`done`),
carrying the (possibly updated) state forward. Build these with [goto](/reference/workflows/functions/goto/) / [done](/reference/workflows/functions/done/).

## Type Parameters

| Type Parameter |
| ------ |
| `S` |
