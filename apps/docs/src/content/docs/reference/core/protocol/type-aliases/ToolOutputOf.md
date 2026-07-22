---
editUrl: false
next: false
prev: false
title: "ToolOutputOf"
---

```ts
type ToolOutputOf<T> = T extends Tool<infer _N, infer _In, infer Out, infer _D> ? Out : never;
```

Defined in: [packages/core/src/protocol/tool.ts:80](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/tool.ts#L80)

Recover the output type of a [Tool](/reference/core/protocol/interfaces/tool/) `T`, or `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
