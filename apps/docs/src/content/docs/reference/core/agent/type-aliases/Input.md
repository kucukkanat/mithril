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

Defined in: [packages/core/src/agent/agent-types.ts:34](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L34)

The input to a run: either a bare string (treated as a single `user` message) or an
ordered list of [InputMessage](/reference/core/agent/type-aliases/inputmessage/)s (a pre-seeded conversation).
