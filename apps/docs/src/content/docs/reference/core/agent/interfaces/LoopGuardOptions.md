---
editUrl: false
next: false
prev: false
title: "LoopGuardOptions"
---

Defined in: [packages/core/src/agent/healing.ts:228](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/healing.ts#L228)

Options for [loopGuard](/reference/core/agent/functions/loopguard/).

## Properties

### haltAt?

```ts
readonly optional haltAt?: number;
```

Defined in: [packages/core/src/agent/healing.ts:232](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/healing.ts#L232)

Identical-call count at which the run halts with a `LoopDetected` error. Default 4.

***

### steerAt?

```ts
readonly optional steerAt?: number;
```

Defined in: [packages/core/src/agent/healing.ts:230](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/healing.ts#L230)

Identical-call count at which the model is steered once with a nudge. Default 3.
