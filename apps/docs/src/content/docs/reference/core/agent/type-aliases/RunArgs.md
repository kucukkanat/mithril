---
editUrl: false
next: false
prev: false
title: "RunArgs"
---

```ts
type RunArgs<Deps> = [Deps] extends [void] ? [RunOptions<void>] : [RunOptions<Deps>];
```

Defined in: [packages/core/src/agent/agent-types.ts:83](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L83)

The trailing argument tuple of the run methods, made optional when `Deps` is `void`.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |

## Remarks

A no-deps agent (`Deps = void`) needs no options object at all: `await agent.run("hi")`.
