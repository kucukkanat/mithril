---
editUrl: false
next: false
prev: false
title: "EventMeta"
---

Defined in: [packages/core/src/protocol/events.ts:28](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/events.ts#L28)

The envelope fields present on every [MithrilEvent](/mithril/reference/core/protocol/type-aliases/mithrilevent/).

## Remarks

The loop is the single authority for these fields; providers never assign them.

## Properties

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/protocol/events.ts:31](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/events.ts#L31)

***

### seq

```ts
readonly seq: number;
```

Defined in: [packages/core/src/protocol/events.ts:36](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/events.ts#L36)

Monotonic, gap-free sequence number per run. Serves as ordering key,
replay cursor, and the basis for gap detection.

***

### span

```ts
readonly span: SpanRef;
```

Defined in: [packages/core/src/protocol/events.ts:39](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/events.ts#L39)

***

### ts

```ts
readonly ts: number;
```

Defined in: [packages/core/src/protocol/events.ts:38](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/events.ts#L38)

Emission time in epoch milliseconds (from `runtime.now()`).

***

### v

```ts
readonly v: 1;
```

Defined in: [packages/core/src/protocol/events.ts:30](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/events.ts#L30)

Protocol MAJOR version; the [migrate](/mithril/reference/core/protocol/functions/migrate/) codec keys off this.
