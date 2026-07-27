---
editUrl: false
next: false
prev: false
title: "ToolInputOf"
---

```ts
type ToolInputOf<T> = T extends Tool<infer _N, infer In, infer _O, infer _D> ? In : never;
```

Defined in: [packages/core/src/protocol/tool.ts:97](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool.ts#L97)

Recover the validated input type of a [Tool](/mithril/reference/core/protocol/interfaces/tool/) `T`, or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
