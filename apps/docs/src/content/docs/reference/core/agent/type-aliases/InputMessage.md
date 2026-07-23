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

Defined in: [packages/core/src/agent/agent-types.ts:26](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L26)

A single conversation turn supplied as run input — either a `user` or `assistant` message.

## See

[Input](/reference/core/agent/type-aliases/input/) for the aggregate input shape accepted by [Agent.run](/reference/core/agent/interfaces/agent/#run).
