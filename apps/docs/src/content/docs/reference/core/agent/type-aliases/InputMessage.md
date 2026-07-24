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

Defined in: [packages/core/src/agent/agent-types.ts:28](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L28)

A single conversation turn supplied as run input — either a `user` or `assistant` message.

## See

[Input](/mithril/reference/core/agent/type-aliases/input/) for the aggregate input shape accepted by [Agent.run](/mithril/reference/core/agent/interfaces/agent/#run).
