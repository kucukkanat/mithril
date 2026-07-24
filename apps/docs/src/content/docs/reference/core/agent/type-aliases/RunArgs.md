---
editUrl: false
next: false
prev: false
title: "RunArgs"
---

```ts
type RunArgs<Deps> = [Deps] extends [void] ? [RunOptions<void>] : [RunOptions<Deps>];
```

Defined in: [packages/core/src/agent/agent-types.ts:76](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/agent-types.ts#L76)

The trailing argument tuple of the run methods, made optional when `Deps` is `void`.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |

## Remarks

A no-deps agent (`Deps = void`) needs no options object at all: `await agent.run("hi")`.
