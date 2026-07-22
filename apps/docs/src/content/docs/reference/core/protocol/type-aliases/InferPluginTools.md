---
editUrl: false
next: false
prev: false
title: "InferPluginTools"
---

```ts
type InferPluginTools<P> = P extends (...args) => infer R ? InferPluginTools<R> : P extends Plugin<infer _D, infer T> ? { [E in T[number] as E extends Tool<infer N, infer _I, infer _O, infer _Dp> ? N : never]: { input: ToolInputOf<E> } } : never;
```

Defined in: [packages/core/src/protocol/middleware.ts:155](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L155)

Recover a `{ [toolName]: { input } }` map from a [Plugin](/reference/core/protocol/interfaces/plugin/) (or a factory
returning one), for typed access to a plugin's tool inputs.

## Type Parameters

| Type Parameter |
| ------ |
| `P` |
