---
editUrl: false
next: false
prev: false
title: "LoopGuardOptions"
---

Defined in: [packages/core/src/agent/healing.ts:228](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/healing.ts#L228)

Options for [loopGuard](/mithril/reference/core/agent/functions/loopguard/).

## Properties

### haltAt?

```ts
readonly optional haltAt?: number;
```

Defined in: [packages/core/src/agent/healing.ts:232](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/healing.ts#L232)

Identical-call count at which the run halts with a `LoopDetected` error. Default 4.

***

### steerAt?

```ts
readonly optional steerAt?: number;
```

Defined in: [packages/core/src/agent/healing.ts:230](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/healing.ts#L230)

Identical-call count at which the model is steered once with a nudge. Default 3.
