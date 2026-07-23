---
editUrl: false
next: false
prev: false
title: "DepsOption"
---

```ts
type DepsOption<Deps> = [Deps] extends [void] ? {
  deps?: undefined;
} : {
  deps: Deps;
};
```

Defined in: [packages/core/src/agent/agent-types.ts:41](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L41)

The `Deps` slot of [RunOptions](/reference/core/agent/type-aliases/runoptions/): required when the agent has dependencies, and optional (may be
omitted, or given as `undefined`) when `Deps` is `void`. This is what lets a no-deps agent pass a bare
`{ signal }` without the `deps: undefined` ceremony.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |
