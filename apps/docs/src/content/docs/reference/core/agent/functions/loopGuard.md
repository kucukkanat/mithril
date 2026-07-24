---
editUrl: false
next: false
prev: false
title: "loopGuard"
---

```ts
function loopGuard<Deps>(opts?): Middleware<Deps>;
```

Defined in: [packages/core/src/agent/healing.ts:264](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/healing.ts#L264)

Step-altitude no-progress guard: over identical `(tool, canonical-args)` signatures, the model is
steered once at `steerAt` (a `loop.detected` with `action: "steer"` plus an injected nudge), then the
run halts at `haltAt` with a typed `LoopDetected` error (`action: "halt"`). Catches the residual case of
identical calls that don't (or no longer) error — repeated *failing* calls are bounded by
[retryBudget](/mithril/reference/core/agent/functions/retrybudget/) first.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`LoopGuardOptions`](/mithril/reference/core/agent/interfaces/loopguardoptions/) | see [LoopGuardOptions](/mithril/reference/core/agent/interfaces/loopguardoptions/). `steerAt` defaults to 3, `haltAt` to 4. |

## Returns

[`Middleware`](/mithril/reference/core/protocol/interfaces/middleware/)\<`Deps`\>
