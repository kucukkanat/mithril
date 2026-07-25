---
editUrl: false
next: false
prev: false
title: "InferPluginTools"
---

```ts
type InferPluginTools<P> = P extends (...args) => infer R ? InferPluginTools<R> : P extends Plugin<infer _D, infer T> ? { [E in T[number] as E extends Tool<infer N, infer _I, infer _O, infer _Dp> ? N : never]: { input: ToolInputOf<E> } } : never;
```

Defined in: [packages/core/src/protocol/middleware.ts:279](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L279)

Recover a `{ [toolName]: { input } }` map from a [Plugin](/mithril/reference/core/protocol/interfaces/plugin/) (or a factory
returning one), for typed access to a plugin's tool inputs.

## Type Parameters

| Type Parameter |
| ------ |
| `P` |
