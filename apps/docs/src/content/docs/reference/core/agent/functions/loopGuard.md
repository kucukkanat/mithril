---
editUrl: false
next: false
prev: false
title: "loopGuard"
---

```ts
function loopGuard<Deps>(opts?): Middleware<Deps>;
```

Defined in: [packages/core/src/agent/healing.ts:244](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/healing.ts#L244)

Step-altitude no-progress guard: over identical `(tool, canonical-args)` signatures, the model is
steered once at `steerAt` (a `loop.detected` with `action: "steer"` plus an injected nudge), then the
run halts at `haltAt` with a typed `LoopDetected` error (`action: "halt"`). Catches the residual case of
identical calls that don't (or no longer) error — repeated *failing* calls are bounded by
[retryBudget](/reference/core/agent/functions/retrybudget/) first.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`LoopGuardOptions`](/reference/core/agent/interfaces/loopguardoptions/) | see [LoopGuardOptions](/reference/core/agent/interfaces/loopguardoptions/). `steerAt` defaults to 3, `haltAt` to 4. |

## Returns

[`Middleware`](/reference/core/protocol/interfaces/middleware/)\<`Deps`\>
