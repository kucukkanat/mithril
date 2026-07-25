---
editUrl: false
next: false
prev: false
title: "ToolInputOf"
---

```ts
type ToolInputOf<T> = T extends Tool<infer _N, infer In, infer _O, infer _D> ? In : never;
```

Defined in: [packages/core/src/protocol/tool.ts:91](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/tool.ts#L91)

Recover the validated input type of a [Tool](/mithril/reference/core/protocol/interfaces/tool/) `T`, or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
