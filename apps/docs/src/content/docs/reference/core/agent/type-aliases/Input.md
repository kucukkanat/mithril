---
editUrl: false
next: false
prev: false
title: "Input"
---

```ts
type Input = 
  | string
  | readonly InputMessage[];
```

Defined in: [packages/core/src/agent/agent-types.ts:33](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L33)

The input to a run: either a bare string (treated as a single `user` message) or an
ordered list of [InputMessage](/reference/core/agent/type-aliases/inputmessage/)s (a pre-seeded conversation).
