---
editUrl: false
next: false
prev: false
title: "RunArgs"
---

```ts
type RunArgs<Deps> = [Deps] extends [void] ? [RunOptions<void>] : [RunOptions<Deps>];
```

Defined in: [packages/core/src/agent/agent-types.ts:80](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L80)

The trailing argument tuple of the run methods, made optional when `Deps` is `void`.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |

## Remarks

A no-deps agent (`Deps = void`) needs no options object at all: `await agent.run("hi")`.
