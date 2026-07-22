---
editUrl: false
next: false
prev: false
title: "WorkflowStep"
---

```ts
type WorkflowStep<S> = (state) => 
  | StepResult<S>
| Promise<StepResult<S>>;
```

Defined in: [packages/workflows/src/index.ts:19](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/workflows/src/index.ts#L19)

A single workflow step: a pure-ish function of the current state that decides where to go next.
It may be async (e.g. it awaits an agent run) and returns a [StepResult](/reference/workflows/type-aliases/stepresult/).

## Type Parameters

| Type Parameter |
| ------ |
| `S` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `S` |

## Returns

  \| [`StepResult`](/reference/workflows/type-aliases/stepresult/)\<`S`\>
  \| `Promise`\<[`StepResult`](/reference/workflows/type-aliases/stepresult/)\<`S`\>\>
