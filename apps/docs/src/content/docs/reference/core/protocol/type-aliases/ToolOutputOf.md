---
editUrl: false
next: false
prev: false
title: "ToolOutputOf"
---

```ts
type ToolOutputOf<T> = T extends Tool<infer _N, infer _In, infer Out, infer _D> ? Out : never;
```

Defined in: [packages/core/src/protocol/tool.ts:74](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/tool.ts#L74)

Recover the output type of a [Tool](/reference/core/protocol/interfaces/tool/) `T`, or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
