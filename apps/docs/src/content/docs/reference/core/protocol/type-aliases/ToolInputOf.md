---
editUrl: false
next: false
prev: false
title: "ToolInputOf"
---

```ts
type ToolInputOf<T> = T extends Tool<infer _N, infer In, infer _O, infer _D> ? In : never;
```

Defined in: [packages/core/src/protocol/tool.ts:78](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/tool.ts#L78)

Recover the validated input type of a [Tool](/reference/core/protocol/interfaces/tool/) `T`, or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
