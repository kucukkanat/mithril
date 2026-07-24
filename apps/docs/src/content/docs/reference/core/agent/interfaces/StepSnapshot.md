---
editUrl: false
next: false
prev: false
title: "StepSnapshot"
---

Defined in: [packages/core/src/agent/agent-types.ts:136](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L136)

A per-step view yielded by [Agent.iterate](/mithril/reference/core/agent/interfaces/agent/#iterate): the step index, the events emitted during it, and a
[RunState](/mithril/reference/core/protocol/interfaces/runstate/) replay of the whole run so far.

## Properties

### events

```ts
readonly events: readonly MithrilEvent[];
```

Defined in: [packages/core/src/agent/agent-types.ts:138](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L138)

***

### state

```ts
readonly state: RunState;
```

Defined in: [packages/core/src/agent/agent-types.ts:139](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L139)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:137](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L137)
