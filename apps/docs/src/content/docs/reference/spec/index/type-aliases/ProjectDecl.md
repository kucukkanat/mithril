---
editUrl: false
next: false
prev: false
title: "ProjectDecl"
---

```ts
type ProjectDecl = 
  | ToolSpec
  | AgentSpec
  | SubAgentToolSpec
  | WorkflowSpec
  | OpaqueDecl;
```

Defined in: [packages/spec/src/types.ts:153](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L153)

Any top-level declaration in a project, in statement order.
