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

Defined in: [packages/workflows/src/index.ts:19](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/workflows/src/index.ts#L19)

A single workflow step: a pure-ish function of the current state that decides where to go next.
It may be async (e.g. it awaits an agent run) and returns a [StepResult](/mithril/reference/workflows/type-aliases/stepresult/).

## Type Parameters

| Type Parameter |
| ------ |
| `S` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `S` |

## Returns

  \| [`StepResult`](/mithril/reference/workflows/type-aliases/stepresult/)\<`S`\>
  \| `Promise`\<[`StepResult`](/mithril/reference/workflows/type-aliases/stepresult/)\<`S`\>\>
