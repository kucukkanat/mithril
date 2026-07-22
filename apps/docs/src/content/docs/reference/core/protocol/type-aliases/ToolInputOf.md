---
editUrl: false
next: false
prev: false
title: "ToolInputOf"
---

```ts
type ToolInputOf<T> = T extends Tool<infer _N, infer In, infer _O, infer _D> ? In : never;
```

Defined in: [packages/core/src/protocol/tool.ts:72](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/tool.ts#L72)

Recover the validated input type of a [Tool](/reference/core/protocol/interfaces/tool/) `T`, or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
