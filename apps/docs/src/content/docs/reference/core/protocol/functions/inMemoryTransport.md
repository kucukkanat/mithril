---
editUrl: false
next: false
prev: false
title: "inMemoryTransport"
---

```ts
function inMemoryTransport(): EventTransport;
```

Defined in: [packages/core/src/protocol/transport.ts:29](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/transport.ts#L29)

Create an in-memory fan-out [EventTransport](/reference/core/protocol/interfaces/eventtransport/) backed by a retained log.

## Returns

[`EventTransport`](/reference/core/protocol/interfaces/eventtransport/)

A transport whose late subscribers catch up gap-free from `resumeFrom`.

## Example

```ts
const bus = inMemoryTransport();
const off = bus.subscribe((e) => console.log(e.seq), 0);
bus.publish(event);
off();
```
