---
editUrl: false
next: false
prev: false
title: "RunOptions"
---

Defined in: packages/core/src/agent/agent-types.ts:44

Per-run options passed to [Agent.run](/reference/core/agent/interfaces/agent/#run), [Agent.stream](/reference/core/agent/interfaces/agent/#stream), and [Agent.resume](/reference/core/agent/interfaces/agent/#resume).

## Remarks

`transport` omitted falls back to BYOK resolved from the environment (`<PROVIDER>_API_KEY`).
`providers` omitted requires `model` to be a self-wiring ModelHandle. Cancellation is
driven exclusively by `signal` in this slice — the timeout idiom is `AbortSignal.timeout(ms)`.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency object injected into tool/instruction [RunContext](/reference/core/protocol/interfaces/runcontext/)s. |

## Properties

### deps

```ts
readonly deps: Deps;
```

Defined in: packages/core/src/agent/agent-types.ts:45

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: packages/core/src/agent/agent-types.ts:50

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: packages/core/src/agent/agent-types.ts:47

***

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

Defined in: packages/core/src/agent/agent-types.ts:49

***

### signal?

```ts
readonly optional signal?: AbortSignal;
```

Defined in: packages/core/src/agent/agent-types.ts:48

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: packages/core/src/agent/agent-types.ts:46
