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

Defined in: [packages/core/src/agent/agent-types.ts:45](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/agent/agent-types.ts#L45)

The `Deps` slot of [RunOptions](/mithril/reference/core/agent/type-aliases/runoptions/): required when the agent has dependencies, and optional (may be
omitted, or given as `undefined`) when `Deps` is `void`. This is what lets a no-deps agent pass a bare
`{ signal }` without the `deps: undefined` ceremony.

## Type Parameters

| Type Parameter |
| ------ |
| `Deps` |
