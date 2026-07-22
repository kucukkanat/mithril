---
editUrl: false
next: false
prev: false
title: "EventMeta"
---

Defined in: [packages/core/src/protocol/events.ts:26](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/events.ts#L26)

The envelope fields present on every [MithrilEvent](/reference/core/protocol/type-aliases/mithrilevent/).

## Remarks

The loop is the single authority for these fields; providers never assign them.

## Properties

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/events.ts:29](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/events.ts#L29)

***

### seq

```ts
readonly seq: number;
```

Defined in: [packages/core/src/protocol/events.ts:34](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/events.ts#L34)

Monotonic, gap-free sequence number per run. Serves as ordering key,
replay cursor, and the basis for gap detection.

***

### span

```ts
readonly span: SpanRef;
```

Defined in: [packages/core/src/protocol/events.ts:37](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/events.ts#L37)

***

### ts

```ts
readonly ts: number;
```

Defined in: [packages/core/src/protocol/events.ts:36](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/events.ts#L36)

Emission time in epoch milliseconds (from `runtime.now()`).

***

### v

```ts
readonly v: 1;
```

Defined in: [packages/core/src/protocol/events.ts:28](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/events.ts#L28)

Protocol MAJOR version; the [migrate](/reference/core/protocol/functions/migrate/) codec keys off this.
