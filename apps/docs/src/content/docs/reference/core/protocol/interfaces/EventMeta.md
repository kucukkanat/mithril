---
editUrl: false
next: false
prev: false
title: "EventMeta"
---

Defined in: [packages/core/src/protocol/events.ts:27](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/events.ts#L27)

The envelope fields present on every [MithrilEvent](/reference/core/protocol/type-aliases/mithrilevent/).

## Remarks

The loop is the single authority for these fields; providers never assign them.

## Properties

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/events.ts:30](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/events.ts#L30)

***

### seq

```ts
readonly seq: number;
```

Defined in: [packages/core/src/protocol/events.ts:35](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/events.ts#L35)

Monotonic, gap-free sequence number per run. Serves as ordering key,
replay cursor, and the basis for gap detection.

***

### span

```ts
readonly span: SpanRef;
```

Defined in: [packages/core/src/protocol/events.ts:38](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/events.ts#L38)

***

### ts

```ts
readonly ts: number;
```

Defined in: [packages/core/src/protocol/events.ts:37](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/events.ts#L37)

Emission time in epoch milliseconds (from `runtime.now()`).

***

### v

```ts
readonly v: 1;
```

Defined in: [packages/core/src/protocol/events.ts:29](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/events.ts#L29)

Protocol MAJOR version; the [migrate](/reference/core/protocol/functions/migrate/) codec keys off this.
