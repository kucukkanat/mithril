---
editUrl: false
next: false
prev: false
title: "LoopGuardOptions"
---

Defined in: [packages/core/src/agent/healing.ts:248](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/healing.ts#L248)

Options for [loopGuard](/mithril/reference/core/agent/functions/loopguard/).

## Properties

### haltAt?

```ts
readonly optional haltAt?: number;
```

Defined in: [packages/core/src/agent/healing.ts:252](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/healing.ts#L252)

Identical-call count at which the run halts with a `LoopDetected` error. Default 4.

***

### steerAt?

```ts
readonly optional steerAt?: number;
```

Defined in: [packages/core/src/agent/healing.ts:250](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/healing.ts#L250)

Identical-call count at which the model is steered once with a nudge. Default 3.
