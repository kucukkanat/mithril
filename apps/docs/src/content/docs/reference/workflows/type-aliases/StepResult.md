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

Defined in: [packages/workflows/src/index.ts:13](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/workflows/src/index.ts#L13)

What a [WorkflowStep](/reference/workflows/type-aliases/workflowstep/) returns: either route to another step (`goto`) or finish (`done`),
carrying the (possibly updated) state forward. Build these with [goto](/reference/workflows/functions/goto/) / [done](/reference/workflows/functions/done/).

## Type Parameters

| Type Parameter |
| ------ |
| `S` |
