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

Defined in: packages/spec/src/types.ts:180

Any top-level declaration in a project, in statement order.
