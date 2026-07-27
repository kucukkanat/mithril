---
editUrl: false
next: false
prev: false
title: "RunState"
---

Defined in: [packages/core/src/protocol/state.ts:55](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/state.ts#L55)

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

Defined in: [packages/core/src/protocol/state.ts:79](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/state.ts#L79)

internal bookkeeping for span→owning-run routing; not part of the public contract, always JSON-safe.
 `""` = the root run; any other value = the sub-run rooted at that span id.

***

### cursor

```ts
readonly cursor: number;
```

Defined in: [packages/core/src/protocol/state.ts:61](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/state.ts#L61)

The last applied event `seq`; `-1` before any event is reduced.

***

### messages

```ts
readonly messages: readonly Message[];
```

Defined in: [packages/core/src/protocol/state.ts:58](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/state.ts#L58)

***

### pending?

```ts
readonly optional pending?: SuspensionDescriptor;
```

Defined in: [packages/core/src/protocol/state.ts:63](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/state.ts#L63)

The suspension this run is waiting on, when `status` is `'suspended'`.

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/state.ts:56](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/state.ts#L56)

***

### status

```ts
readonly status: RunStatus;
```

Defined in: [packages/core/src/protocol/state.ts:57](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/state.ts#L57)

***

### subruns?

```ts
readonly optional subruns?: Readonly<Record<string, RunState>>;
```

Defined in: [packages/core/src/protocol/state.ts:76](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/state.ts#L76)

Sub-run state keyed by sub-span id. `reduce` routes each event by `span` so a sub-agent's
 lifecycle accrues HERE, not into root (closes the span-blind-reducer corruption).

***

### tools?

```ts
readonly optional tools?: Readonly<Record<string, ToolDefinition>>;
```

Defined in: [packages/core/src/protocol/state.ts:73](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/state.ts#L73)

Tools this run gained after step 0, keyed by name — the fold of `tool.registered`/`tool.revoked`.

#### Remarks

Absent (not `{}`) until the first registration. Holds only tools that arrived *during* the run
(plugin `setup` and runtime definitions); an agent's statically declared tools are configuration, not
log content, and never appear here. Reconstructs which tools existed, not what they returned —
outputs come from the recorded `tool.result` events, as for every other tool.

***

### usage

```ts
readonly usage: UsageTotals;
```

Defined in: [packages/core/src/protocol/state.ts:59](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/state.ts#L59)
