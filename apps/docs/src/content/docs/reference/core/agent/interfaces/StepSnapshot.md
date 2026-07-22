---
editUrl: false
next: false
prev: false
title: "StepSnapshot"
---

Defined in: [packages/core/src/agent/agent-types.ts:124](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L124)

A per-step view yielded by [Agent.iterate](/reference/core/agent/interfaces/agent/#iterate): the step index, the events emitted during it, and a
[RunState](/reference/core/protocol/interfaces/runstate/) replay of the whole run so far.

## Properties

### events

```ts
readonly events: readonly MithrilEvent[];
```

Defined in: [packages/core/src/agent/agent-types.ts:126](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L126)

***

### state

```ts
readonly state: RunState;
```

Defined in: [packages/core/src/agent/agent-types.ts:127](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L127)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:125](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L125)
