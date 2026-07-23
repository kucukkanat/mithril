---
editUrl: false
next: false
prev: false
title: "LoopGuardOptions"
---

Defined in: packages/core/src/agent/healing.ts:114

Options for [loopGuard](/reference/core/agent/functions/loopguard/).

## Properties

### haltAt?

```ts
readonly optional haltAt?: number;
```

Defined in: packages/core/src/agent/healing.ts:118

Identical-call count at which the run halts with a `LoopDetected` error. Default 4.

***

### steerAt?

```ts
readonly optional steerAt?: number;
```

Defined in: packages/core/src/agent/healing.ts:116

Identical-call count at which the model is steered once with a nudge. Default 3.
