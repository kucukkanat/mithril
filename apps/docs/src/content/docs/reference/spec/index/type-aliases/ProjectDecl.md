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

Defined in: [packages/spec/src/types.ts:159](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/types.ts#L159)

Any top-level declaration in a project, in statement order.
