---
editUrl: false
next: false
prev: false
title: "inMemoryTransport"
---

```ts
function inMemoryTransport(): EventTransport;
```

Defined in: [packages/core/src/protocol/transport.ts:29](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/transport.ts#L29)

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
