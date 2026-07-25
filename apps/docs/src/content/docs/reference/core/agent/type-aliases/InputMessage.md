---
editUrl: false
next: false
prev: false
title: "InputMessage"
---

```ts
type InputMessage = 
  | {
  content:   | string
     | readonly ContentPart[];
  role: "user";
}
  | {
  content: string;
  role: "assistant";
};
```

Defined in: [packages/core/src/agent/agent-types.ts:30](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/agent/agent-types.ts#L30)

A single conversation turn supplied as run input — either a `user` or `assistant` message.

## See

[Input](/mithril/reference/core/agent/type-aliases/input/) for the aggregate input shape accepted by [Agent.run](/mithril/reference/core/agent/interfaces/agent/#run).
