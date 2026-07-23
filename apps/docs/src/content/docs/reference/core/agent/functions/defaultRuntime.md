---
editUrl: false
next: false
prev: false
title: "defaultRuntime"
---

```ts
function defaultRuntime(): RuntimeAdapter;
```

Defined in: [packages/core/src/agent/runtime.ts:14](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/runtime.ts#L14)

Build the default [RuntimeAdapter](/reference/core/protocol/interfaces/runtimeadapter/) backed by `globalThis` (§3.2).

## Returns

[`RuntimeAdapter`](/reference/core/protocol/interfaces/runtimeadapter/)

a runtime seam wiring `fetch`, `now`, `randomUUID`, `getRandomValues`, and `subtle` to the
platform globals. Use it as the default when no `runtime` is supplied in [RunOptions](/reference/core/agent/type-aliases/runoptions/)/[LoopOptions](/reference/core/agent/interfaces/loopoptions/).

## Remarks

`subtle` is feature-detected and may be `undefined` in insecure browser contexts (which is why
[seal](/reference/core/agent/functions/seal/)/[open](/reference/core/agent/functions/open/) throw a [StateIntegrityError](/reference/core/agent/classes/stateintegrityerror/) there); UUIDs and random bytes come from
`crypto`, which is always available.
