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

Defined in: [packages/core/src/agent/agent-types.ts:38](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/agent-types.ts#L38)

The input to a run: either a bare string (treated as a single `user` message) or an
ordered list of [InputMessage](/mithril/reference/core/agent/type-aliases/inputmessage/)s (a pre-seeded conversation).
