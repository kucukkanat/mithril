---
editUrl: false
next: false
prev: false
title: "RunOptions"
---

```ts
type RunOptions<Deps> = DepsOption<Deps> & RunOptionsBase;
```

Defined in: [packages/core/src/agent/agent-types.ts:68](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L68)

Per-run options passed to [Agent.run](/reference/core/agent/interfaces/agent/#run), [Agent.stream](/reference/core/agent/interfaces/agent/#stream), and [Agent.resume](/reference/core/agent/interfaces/agent/#resume).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency object injected into tool/instruction [RunContext](/reference/core/protocol/interfaces/runcontext/)s. |

## Remarks

`deps` is required only when `Deps` is non-`void`; a no-deps agent may pass `{ signal }` (or any other
option) with no `deps` field at all. `transport` omitted falls back to BYOK resolved from the environment
(`<PROVIDER>_API_KEY`). `providers` omitted requires `model` to be a self-wiring ModelHandle.
Cancellation is driven by `signal` — the timeout idiom is `AbortSignal.timeout(ms)`.
