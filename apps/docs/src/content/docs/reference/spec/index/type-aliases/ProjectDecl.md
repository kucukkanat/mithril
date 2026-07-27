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

Defined in: [packages/spec/src/types.ts:159](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L159)

Any top-level declaration in a project, in statement order.
