---
editUrl: false
next: false
prev: false
title: "ToolOutputOf"
---

```ts
type ToolOutputOf<T> = T extends Tool<infer _N, infer _In, infer Out, infer _D> ? Out : never;
```

Defined in: [packages/core/src/protocol/tool.ts:99](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/tool.ts#L99)

Recover the output type of a [Tool](/mithril/reference/core/protocol/interfaces/tool/) `T`, or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
