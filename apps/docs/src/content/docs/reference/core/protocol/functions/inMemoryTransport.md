---
editUrl: false
next: false
prev: false
title: "inMemoryTransport"
---

```ts
function inMemoryTransport(): EventTransport;
```

Defined in: [packages/core/src/protocol/transport.ts:29](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/transport.ts#L29)

Create an in-memory fan-out [EventTransport](/mithril/reference/core/protocol/interfaces/eventtransport/) backed by a retained log.

## Returns

[`EventTransport`](/mithril/reference/core/protocol/interfaces/eventtransport/)

A transport whose late subscribers catch up gap-free from `resumeFrom`.

## Example

```ts
const bus = inMemoryTransport();
const off = bus.subscribe((e) => console.log(e.seq), 0);
bus.publish(event);
off();
```
