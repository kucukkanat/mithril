---
editUrl: false
next: false
prev: false
title: "StepSnapshot"
---

Defined in: [packages/core/src/agent/agent-types.ts:139](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/agent-types.ts#L139)

A per-step view yielded by [Agent.iterate](/mithril/reference/core/agent/interfaces/agent/#iterate): the step index, the events emitted during it, and a
[RunState](/mithril/reference/core/protocol/interfaces/runstate/) replay of the whole run so far.

## Properties

### events

```ts
readonly events: readonly MithrilEvent[];
```

Defined in: [packages/core/src/agent/agent-types.ts:141](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/agent-types.ts#L141)

***

### state

```ts
readonly state: RunState;
```

Defined in: [packages/core/src/agent/agent-types.ts:142](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/agent-types.ts#L142)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:140](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/agent-types.ts#L140)
