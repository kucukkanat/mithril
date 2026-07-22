---
editUrl: false
next: false
prev: false
title: "ToolInputOf"
---

```ts
type ToolInputOf<T> = T extends Tool<infer _N, infer In, infer _O, infer _D> ? In : never;
```

Defined in: [packages/core/src/protocol/tool.ts:72](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/tool.ts#L72)

Recover the validated input type of a [Tool](/reference/core/protocol/interfaces/tool/) `T`, or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
