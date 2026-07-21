---
editUrl: false
next: false
prev: false
title: "StepSnapshot"
---

Defined in: packages/core/src/agent/agent-types.ts:113

A per-step view yielded by [Agent.iterate](/reference/core/agent/interfaces/agent/#iterate): the step index, the events emitted during it, and a
[RunState](/reference/core/protocol/interfaces/runstate/) replay of the whole run so far.

## Properties

### events

```ts
readonly events: readonly MithrilEvent[];
```

Defined in: packages/core/src/agent/agent-types.ts:115

***

### state

```ts
readonly state: RunState;
```

Defined in: packages/core/src/agent/agent-types.ts:116

***

### step

```ts
readonly step: number;
```

Defined in: packages/core/src/agent/agent-types.ts:114
