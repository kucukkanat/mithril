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

Defined in: [packages/core/src/agent/agent-types.ts:25](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L25)

A single conversation turn supplied as run input — either a `user` or `assistant` message.

## See

[Input](/reference/core/agent/type-aliases/input/) for the aggregate input shape accepted by [Agent.run](/reference/core/agent/interfaces/agent/#run).
