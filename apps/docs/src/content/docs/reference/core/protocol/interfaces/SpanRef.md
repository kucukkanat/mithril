---
editUrl: false
next: false
prev: false
title: "SpanRef"
---

Defined in: [packages/core/src/protocol/events.ts:12](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/events.ts#L12)

Identifies the tracing span an event belongs to, forming the parent/child
tree used to route events to their owning (sub-)run.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [packages/core/src/protocol/events.ts:13](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/events.ts#L13)

***

### kind

```ts
readonly kind: "handoff" | "invoke_agent" | "chat" | "execute_tool" | "workflow";
```

Defined in: [packages/core/src/protocol/events.ts:18](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/events.ts#L18)

***

### parentId

```ts
readonly parentId: string | null;
```

Defined in: [packages/core/src/protocol/events.ts:15](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/events.ts#L15)

Parent span id, or `null` for a root span.

***

### traceId

```ts
readonly traceId: string;
```

Defined in: [packages/core/src/protocol/events.ts:17](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/events.ts#L17)

Trace id shared by every span in one logical run tree.
