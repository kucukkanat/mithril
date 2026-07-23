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

Defined in: [packages/spec/src/types.ts:156](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L156)

Any top-level declaration in a project, in statement order.
