---
editUrl: false
next: false
prev: false
title: "InferPluginTools"
---

```ts
type InferPluginTools<P> = P extends (...args) => infer R ? InferPluginTools<R> : P extends Plugin<infer _D, infer T> ? { [E in T[number] as E extends Tool<infer N, infer _I, infer _O, infer _Dp> ? N : never]: { input: ToolInputOf<E> } } : never;
```

Defined in: [packages/core/src/protocol/middleware.ts:231](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L231)

Recover a `{ [toolName]: { input } }` map from a [Plugin](/mithril/reference/core/protocol/interfaces/plugin/) (or a factory
returning one), for typed access to a plugin's tool inputs.

## Type Parameters

| Type Parameter |
| ------ |
| `P` |
