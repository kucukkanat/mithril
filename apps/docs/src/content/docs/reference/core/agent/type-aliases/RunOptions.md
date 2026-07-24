---
editUrl: false
next: false
prev: false
title: "RunOptions"
---

```ts
type RunOptions<Deps> = DepsOption<Deps> & RunOptionsBase<Deps>;
```

Defined in: [packages/core/src/agent/agent-types.ts:69](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L69)

Per-run options passed to [Agent.run](/mithril/reference/core/agent/interfaces/agent/#run), [Agent.stream](/mithril/reference/core/agent/interfaces/agent/#stream), and [Agent.resume](/mithril/reference/core/agent/interfaces/agent/#resume).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency object injected into tool/instruction [RunContext](/mithril/reference/core/protocol/interfaces/runcontext/)s. |

## Remarks

`deps` is required only when `Deps` is non-`void`; a no-deps agent may pass `{ signal }` (or any other
option) with no `deps` field at all. `transport` omitted falls back to BYOK resolved from the environment
(`<PROVIDER>_API_KEY`). `providers` omitted requires `model` to be a self-wiring ModelHandle.
Cancellation is driven by `signal` — the timeout idiom is `AbortSignal.timeout(ms)`.
