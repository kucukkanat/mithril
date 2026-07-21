# @mithril/workflows

Deterministic, code-first routing over a shared typed state. Cheap branching *before* and *around* LLM
calls — no hidden LLM routing unless you write it. A step may run an agent; the routing itself is plain code.

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
// path → ["triage", "review"]; state.decision → "…"
```

## API

- `defineWorkflow(steps, { start, maxSteps? })` → `{ run(initial) }` → `{ state, path }`.
- A `WorkflowStep<S>` returns `goto(next, state)` or `done(state)`.
- `maxSteps` (default 100) guards against cycles.

Steps are ordinary async functions — call `agent.run()`, hit a database, branch on the result. The engine
just threads state and records the path.
