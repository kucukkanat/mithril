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

Defined in: [packages/core/src/agent/agent-types.ts:35](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L35)

The input to a run: either a bare string (treated as a single `user` message) or an
ordered list of [InputMessage](/mithril/reference/core/agent/type-aliases/inputmessage/)s (a pre-seeded conversation).
