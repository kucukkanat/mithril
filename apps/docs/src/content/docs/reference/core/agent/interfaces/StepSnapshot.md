---
editUrl: false
next: false
prev: false
title: "StepSnapshot"
---

Defined in: [packages/core/src/agent/agent-types.ts:139](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L139)

A per-step view yielded by [Agent.iterate](/mithril/reference/core/agent/interfaces/agent/#iterate): the step index, the events emitted during it, and a
[RunState](/mithril/reference/core/protocol/interfaces/runstate/) replay of the whole run so far.

## Properties

### events

```ts
readonly events: readonly MithrilEvent[];
```

Defined in: [packages/core/src/agent/agent-types.ts:141](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L141)

***

### state

```ts
readonly state: RunState;
```

Defined in: [packages/core/src/agent/agent-types.ts:142](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L142)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:140](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L140)
