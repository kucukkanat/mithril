---
editUrl: false
next: false
prev: false
title: "RunArgs"
---

```ts
type RunArgs<Deps> = [Deps] extends [void] ? [RunOptions<void>] : [RunOptions<Deps>];
```

Defined in: [packages/core/src/agent/agent-types.ts:83](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/agent-types.ts#L83)

The trailing argument tuple of the run methods, made optional when `Deps` is `void`.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |

## Remarks

A no-deps agent (`Deps = void`) needs no options object at all: `await agent.run("hi")`.
