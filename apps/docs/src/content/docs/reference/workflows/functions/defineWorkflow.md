---
editUrl: false
next: false
prev: false
title: "defineWorkflow"
---

```ts
function defineWorkflow<S>(steps, opts): Workflow<S>;
```

Defined in: [packages/workflows/src/index.ts:59](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/workflows/src/index.ts#L59)

Define a workflow: a map of named steps plus a `start` step. Each step returns [goto](/mithril/reference/workflows/functions/goto/) to
continue or [done](/mithril/reference/workflows/functions/done/) to finish. Routing is deterministic and network-free — the ideal place
for branching that shouldn't cost an LLM call.

## Type Parameters

| Type Parameter |
| ------ |
| `S` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `steps` | `Readonly`\<`Record`\<`string`, [`WorkflowStep`](/mithril/reference/workflows/type-aliases/workflowstep/)\<`S`\>\>\> | named steps; each is a [WorkflowStep](/mithril/reference/workflows/type-aliases/workflowstep/). |
| `opts` | \{ `maxSteps?`: `number`; `start`: `string`; \} | `start` (the first step) and optional `maxSteps` (default `100`, a cycle guard). |
| `opts.maxSteps?` | `number` | - |
| `opts.start` | `string` | - |

## Returns

[`Workflow`](/mithril/reference/workflows/interfaces/workflow/)\<`S`\>

a [Workflow](/mithril/reference/workflows/interfaces/workflow/) you can `run`.

## Throws

[WorkflowError](/mithril/reference/workflows/classes/workflowerror/) if a step routes to an unknown name or `maxSteps` is exceeded.

## Example

```ts
import { defineWorkflow, goto, done } from "@mithril/workflows";

interface S { amount: number; decision: string }

const refund = defineWorkflow<S>(
  {
    triage: (s) => (s.amount > 100 ? goto("review", s) : goto("approve", s)),
    review: async (s) => done({ ...s, decision: await humanReview(s) }),
    approve: (s) => done({ ...s, decision: "auto-approved" }),
  },
  { start: "triage" },
);

const { state, path } = await refund.run({ amount: 500, decision: "" });
```
