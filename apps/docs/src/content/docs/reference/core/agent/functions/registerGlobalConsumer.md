---
editUrl: false
next: false
prev: false
title: "registerGlobalConsumer"
---

```ts
function registerGlobalConsumer(consumer): () => void;
```

Defined in: packages/core/src/agent/global-consumers.ts:28

Register an [EventConsumer](/reference/core/protocol/interfaces/eventconsumer/) that receives events from **every** run in this process.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `consumer` | [`EventConsumer`](/reference/core/protocol/interfaces/eventconsumer/) | the consumer to fan every run's events out to. |

## Returns

an unregister function; call it to stop receiving events.

() => `void`

## Remarks

The mechanism behind zero-touch devtools attach (`import "mithril/devtools/attach"`). Consumers are
observational only — they read stamped MithrilEvents, never the loop. Prefer a per-agent `use:`
consumer for scoped observation; use this only for cross-cutting, whole-process tooling.

## Example

```ts
import { registerGlobalConsumer } from "@mithril/core/agent";

const off = registerGlobalConsumer({ name: "log", onEvent: (e) => console.log(e.type) });
// …every run now logs; later:
off();
```
