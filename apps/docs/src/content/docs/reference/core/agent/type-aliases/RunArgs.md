---
editUrl: false
next: false
prev: false
title: "RunArgs"
---

```ts
type RunArgs<Deps> = [Deps] extends [void] ? [RunOptions<void>] : [RunOptions<Deps>];
```

Defined in: [packages/core/src/agent/agent-types.ts:75](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L75)

The trailing argument tuple of the run methods, made optional when `Deps` is `void`.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |

## Remarks

A no-deps agent (`Deps = void`) needs no options object at all: `await agent.run("hi")`.
