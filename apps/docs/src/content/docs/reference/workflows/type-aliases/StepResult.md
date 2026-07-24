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

Defined in: [packages/workflows/src/index.ts:13](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/workflows/src/index.ts#L13)

What a [WorkflowStep](/mithril/reference/workflows/type-aliases/workflowstep/) returns: either route to another step (`goto`) or finish (`done`),
carrying the (possibly updated) state forward. Build these with [goto](/mithril/reference/workflows/functions/goto/) / [done](/mithril/reference/workflows/functions/done/).

## Type Parameters

| Type Parameter |
| ------ |
| `S` |
