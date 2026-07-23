---
editUrl: false
next: false
prev: false
title: "StepSnapshot"
---

Defined in: [packages/core/src/agent/agent-types.ts:131](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L131)

A per-step view yielded by [Agent.iterate](/reference/core/agent/interfaces/agent/#iterate): the step index, the events emitted during it, and a
[RunState](/reference/core/protocol/interfaces/runstate/) replay of the whole run so far.

## Properties

### events

```ts
readonly events: readonly MithrilEvent[];
```

Defined in: [packages/core/src/agent/agent-types.ts:133](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L133)

***

### state

```ts
readonly state: RunState;
```

Defined in: [packages/core/src/agent/agent-types.ts:134](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L134)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:132](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L132)
