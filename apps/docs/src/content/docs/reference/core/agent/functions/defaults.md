---
editUrl: false
next: false
prev: false
title: "defaults"
---

```ts
function defaults<Deps>(): readonly Middleware<Deps>[];
```

Defined in: packages/core/src/agent/healing.ts:205

The default self-healing stack, installed by every agent unless its `healing` field overrides it. Order
matters: `argRepair` (tool) and `outputRetry` (finalize) act during a step, while `retryBudget` runs its
budget check before `loopGuard`'s no-progress check so an exhausted tool halts before loop detection fires.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | the agent's dependency bag (inferred). |

## Returns

readonly [`Middleware`](/reference/core/protocol/interfaces/middleware/)\<`Deps`\>[]
