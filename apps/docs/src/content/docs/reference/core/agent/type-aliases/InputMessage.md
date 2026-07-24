---
editUrl: false
next: false
prev: false
title: "InputMessage"
---

```ts
type InputMessage = 
  | {
  content: string;
  role: "user";
}
  | {
  content: string;
  role: "assistant";
};
```

Defined in: [packages/core/src/agent/agent-types.ts:27](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L27)

A single conversation turn supplied as run input — either a `user` or `assistant` message.

## See

[Input](/mithril/reference/core/agent/type-aliases/input/) for the aggregate input shape accepted by [Agent.run](/mithril/reference/core/agent/interfaces/agent/#run).
