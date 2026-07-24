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

Defined in: [packages/core/src/agent/agent-types.ts:36](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L36)

The input to a run: either a bare string (treated as a single `user` message) or an
ordered list of [InputMessage](/mithril/reference/core/agent/type-aliases/inputmessage/)s (a pre-seeded conversation).
