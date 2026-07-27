---
editUrl: false
next: false
prev: false
title: "RunResult"
---

```ts
type RunResult<Out> = 
  | {
  output: Out;
  status: "completed";
  usage: UsageTotals;
}
  | {
  request: SuspensionDescriptor;
  status: "suspended";
  token: string;
}
  | {
  reason: string;
  request: SuspensionDescriptor;
  status: "unresumable";
}
  | {
  error: SerializedError;
  status: "error";
  usage: UsageTotals;
}
  | {
  status: "cancelled";
  usage: UsageTotals;
};
```

Defined in: [packages/core/src/agent/agent-types.ts:100](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/agent-types.ts#L100)

The discriminated result of a completed, suspended, or failed run.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Out` | the run's output type (the validated structured value, or `string`). |

## Remarks

Discriminate on `.status`:
- `"completed"` — carries the final `output` and `usage`.
- `"suspended"` — the run is waiting on a human/external resolution (Tier-1 approval, a Tier-1b
  tool-returned `suspend(...)`, or a Tier-2 `ctx.suspend()`). `request` is the UI-facing pending view;
  `token` is the resume handle (unsigned durable-local JSON by default — [seal](/mithril/reference/core/agent/functions/seal/) it before crossing
  a trust boundary). Resume via [Agent.resume](/mithril/reference/core/agent/interfaces/agent/#resume) (drains to a result) or [Agent.resumeStream](/mithril/reference/core/agent/interfaces/agent/#resumestream)
  (streams the resumed run).
- `"unresumable"` — a resume `token` no longer matches a pending tool call; `reason` explains why.
- `"error"` — carries a [SerializedError](/mithril/reference/core/protocol/interfaces/serializederror/) and `usage`.
- `"cancelled"` — the run's `signal` aborted; carries `usage`.
