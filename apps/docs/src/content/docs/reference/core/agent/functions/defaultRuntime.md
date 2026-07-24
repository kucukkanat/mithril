---
editUrl: false
next: false
prev: false
title: "defaultRuntime"
---

```ts
function defaultRuntime(): RuntimeAdapter;
```

Defined in: [packages/core/src/agent/runtime.ts:14](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/runtime.ts#L14)

Build the default [RuntimeAdapter](/mithril/reference/core/protocol/interfaces/runtimeadapter/) backed by `globalThis` (§3.2).

## Returns

[`RuntimeAdapter`](/mithril/reference/core/protocol/interfaces/runtimeadapter/)

a runtime seam wiring `fetch`, `now`, `randomUUID`, `getRandomValues`, and `subtle` to the
platform globals. Use it as the default when no `runtime` is supplied in [RunOptions](/mithril/reference/core/agent/type-aliases/runoptions/)/[LoopOptions](/mithril/reference/core/agent/interfaces/loopoptions/).

## Remarks

`subtle` is feature-detected and may be `undefined` in insecure browser contexts (which is why
[seal](/mithril/reference/core/agent/functions/seal/)/[open](/mithril/reference/core/agent/functions/open/) throw a [StateIntegrityError](/mithril/reference/core/agent/classes/stateintegrityerror/) there); UUIDs and random bytes come from
`crypto`, which is always available.
