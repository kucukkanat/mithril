---
editUrl: false
next: false
prev: false
title: "defineWorkflow"
---

```ts
function defineWorkflow<S>(steps, opts): Workflow<S>;
```

Defined in: [packages/workflows/src/index.ts:59](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/workflows/src/index.ts#L59)

Define a workflow: a map of named steps plus a `start` step. Each step returns [goto](/reference/workflows/functions/goto/) to
continue or [done](/reference/workflows/functions/done/) to finish. Routing is deterministic and network-free — the ideal place
for branching that shouldn't cost an LLM call.

## Type Parameters

| Type Parameter |
| ------ |
| `S` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `steps` | `Readonly`\<`Record`\<`string`, [`WorkflowStep`](/reference/workflows/type-aliases/workflowstep/)\<`S`\>\>\> | named steps; each is a [WorkflowStep](/reference/workflows/type-aliases/workflowstep/). |
| `opts` | \{ `maxSteps?`: `number`; `start`: `string`; \} | `start` (the first step) and optional `maxSteps` (default `100`, a cycle guard). |
| `opts.maxSteps?` | `number` | - |
| `opts.start` | `string` | - |

## Returns

[`Workflow`](/reference/workflows/interfaces/workflow/)\<`S`\>

a [Workflow](/reference/workflows/interfaces/workflow/) you can `run`.

## Throws

[WorkflowError](/reference/workflows/classes/workflowerror/) if a step routes to an unknown name or `maxSteps` is exceeded.

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
