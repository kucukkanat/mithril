---
editUrl: false
next: false
prev: false
title: "RunState"
---

Defined in: packages/core/src/protocol/state.ts:42

The materialized state of a run — always the pure fold of its event log.

## Remarks

Never stored as an independent mutable checkpoint that could desync; it is
always the result of [replay](/reference/core/protocol/functions/replay/) (or a [reduce](/reference/core/protocol/functions/reduce/) fold) over the log.

## See

[reduce](/reference/core/protocol/functions/reduce/) and [replay](/reference/core/protocol/functions/replay/), which produce this from [MithrilEvent](/reference/core/protocol/type-aliases/mithrilevent/)s.

## Properties

### \_\_owners?

```ts
readonly optional __owners?: Readonly<Record<string, string>>;
```

Defined in: packages/core/src/protocol/state.ts:56

internal bookkeeping for span→owning-run routing; not part of the public contract, always JSON-safe.
 `""` = the root run; any other value = the sub-run rooted at that span id.

***

### cursor

```ts
readonly cursor: number;
```

Defined in: packages/core/src/protocol/state.ts:48

The last applied event `seq`; `-1` before any event is reduced.

***

### messages

```ts
readonly messages: readonly Message[];
```

Defined in: packages/core/src/protocol/state.ts:45

***

### pending?

```ts
readonly optional pending?: SuspensionDescriptor;
```

Defined in: packages/core/src/protocol/state.ts:50

The suspension this run is waiting on, when `status` is `'suspended'`.

***

### runId

```ts
readonly runId: string;
```

Defined in: packages/core/src/protocol/state.ts:43

***

### status

```ts
readonly status: RunStatus;
```

Defined in: packages/core/src/protocol/state.ts:44

***

### subruns?

```ts
readonly optional subruns?: Readonly<Record<string, RunState>>;
```

Defined in: packages/core/src/protocol/state.ts:53

Sub-run state keyed by sub-span id. `reduce` routes each event by `span` so a sub-agent's
 lifecycle accrues HERE, not into root (closes the span-blind-reducer corruption).

***

### usage

```ts
readonly usage: UsageTotals;
```

Defined in: packages/core/src/protocol/state.ts:46
