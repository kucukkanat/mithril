---
editUrl: false
next: false
prev: false
title: "ToolOutputOf"
---

```ts
type ToolOutputOf<T> = T extends Tool<infer _N, infer _In, infer Out, infer _D> ? Out : never;
```

Defined in: packages/core/src/protocol/tool.ts:74

Recover the output type of a [Tool](/reference/core/protocol/interfaces/tool/) `T`, or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
