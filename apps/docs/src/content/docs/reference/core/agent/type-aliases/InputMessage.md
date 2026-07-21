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

Defined in: packages/core/src/agent/agent-types.ts:25

A single conversation turn supplied as run input — either a `user` or `assistant` message.

## See

[Input](/reference/core/agent/type-aliases/input/) for the aggregate input shape accepted by [Agent.run](/reference/core/agent/interfaces/agent/#run).
