---
editUrl: false
next: false
prev: false
title: "SerializedRunState"
---

```ts
type SerializedRunState = string & {
  __brand: "mithril.runstate.v1";
};
```

Defined in: [packages/core/src/protocol/checkpointer.ts:7](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/checkpointer.ts#L7)

A branded opaque string holding a serialized [RunState](/reference/core/protocol/interfaces/runstate/) token blob (v1).

## Type Declaration

### \_\_brand

```ts
readonly __brand: "mithril.runstate.v1";
```
