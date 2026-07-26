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

Defined in: [packages/core/src/agent/agent-types.ts:38](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L38)

The input to a run: either a bare string (treated as a single `user` message) or an
ordered list of [InputMessage](/mithril/reference/core/agent/type-aliases/inputmessage/)s (a pre-seeded conversation).
