---
editUrl: false
next: false
prev: false
title: "SuspendPolicy"
---

```ts
type SuspendPolicy = 
  | "reject"
  | "approve"
  | ((request) => ResumeValue | Promise<ResumeValue>);
```

Defined in: [index.ts:99](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L99)

How a run that suspends for human-in-the-loop is resolved during an *unattended* eval capture.

## Remarks

Plain [runEval](/reference/evals/functions/runeval/) streams the agent but has no human to answer a `needsApproval` tool, so a
suspending run would score as incomplete. This policy auto-answers Tier-1 approval suspensions so scoring
sees the resolved trajectory. `"reject"` (the default) is safest — it never auto-approves a gated tool. A
function receives the SuspensionDescriptor and returns any ResumeValue (e.g. an `"edit"`
decision, or a `{ kind: "resolve", value }` for a tool-returned/`ctx.suspend()` resolution). The string
forms apply only to `tool.approval` suspensions; other kinds stop capture and score as-is.
