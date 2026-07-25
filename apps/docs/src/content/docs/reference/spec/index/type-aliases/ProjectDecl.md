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

Defined in: [packages/spec/src/types.ts:153](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/spec/src/types.ts#L153)

Any top-level declaration in a project, in statement order.
