---
editUrl: false
next: false
prev: false
title: "SpanRef"
---

Defined in: packages/core/src/protocol/events.ts:11

Identifies the tracing span an event belongs to, forming the parent/child
tree used to route events to their owning (sub-)run.

## Properties

### id

```ts
readonly id: string;
```

Defined in: packages/core/src/protocol/events.ts:12

***

### kind

```ts
readonly kind: "handoff" | "invoke_agent" | "chat" | "execute_tool" | "workflow";
```

Defined in: packages/core/src/protocol/events.ts:17

***

### parentId

```ts
readonly parentId: string | null;
```

Defined in: packages/core/src/protocol/events.ts:14

Parent span id, or `null` for a root span.

***

### traceId

```ts
readonly traceId: string;
```

Defined in: packages/core/src/protocol/events.ts:16

Trace id shared by every span in one logical run tree.
