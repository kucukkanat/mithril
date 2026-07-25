---
editUrl: false
next: false
prev: false
title: "RunState"
---

Defined in: [packages/core/src/protocol/state.ts:54](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/state.ts#L54)

The materialized state of a run — always the pure fold of its event log.

## Remarks

Never stored as an independent mutable checkpoint that could desync; it is
always the result of [replay](/mithril/reference/core/protocol/functions/replay/) (or a [reduce](/mithril/reference/core/protocol/functions/reduce/) fold) over the log.

## See

[reduce](/mithril/reference/core/protocol/functions/reduce/) and [replay](/mithril/reference/core/protocol/functions/replay/), which produce this from [MithrilEvent](/mithril/reference/core/protocol/type-aliases/mithrilevent/)s.

## Properties

### \_\_owners?

```ts
readonly optional __owners?: Readonly<Record<string, string>>;
```

Defined in: [packages/core/src/protocol/state.ts:68](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/state.ts#L68)

internal bookkeeping for span→owning-run routing; not part of the public contract, always JSON-safe.
 `""` = the root run; any other value = the sub-run rooted at that span id.

***

### cursor

```ts
readonly cursor: number;
```

Defined in: [packages/core/src/protocol/state.ts:60](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/state.ts#L60)

The last applied event `seq`; `-1` before any event is reduced.

***

### messages

```ts
readonly messages: readonly Message[];
```

Defined in: [packages/core/src/protocol/state.ts:57](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/state.ts#L57)

***

### pending?

```ts
readonly optional pending?: SuspensionDescriptor;
```

Defined in: [packages/core/src/protocol/state.ts:62](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/state.ts#L62)

The suspension this run is waiting on, when `status` is `'suspended'`.

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/state.ts:55](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/state.ts#L55)

***

### status

```ts
readonly status: RunStatus;
```

Defined in: [packages/core/src/protocol/state.ts:56](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/state.ts#L56)

***

### subruns?

```ts
readonly optional subruns?: Readonly<Record<string, RunState>>;
```

Defined in: [packages/core/src/protocol/state.ts:65](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/state.ts#L65)

Sub-run state keyed by sub-span id. `reduce` routes each event by `span` so a sub-agent's
 lifecycle accrues HERE, not into root (closes the span-blind-reducer corruption).

***

### usage

```ts
readonly usage: UsageTotals;
```

Defined in: [packages/core/src/protocol/state.ts:58](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/state.ts#L58)
