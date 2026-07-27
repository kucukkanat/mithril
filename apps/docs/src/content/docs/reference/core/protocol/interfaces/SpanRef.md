---
editUrl: false
next: false
prev: false
title: "SpanRef"
---

Defined in: [packages/core/src/protocol/events.ts:13](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/events.ts#L13)

Identifies the tracing span an event belongs to, forming the parent/child
tree used to route events to their owning (sub-)run.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [packages/core/src/protocol/events.ts:14](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/events.ts#L14)

***

### kind

```ts
readonly kind: "handoff" | "invoke_agent" | "chat" | "execute_tool" | "workflow";
```

Defined in: [packages/core/src/protocol/events.ts:19](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/events.ts#L19)

***

### parentId

```ts
readonly parentId: string | null;
```

Defined in: [packages/core/src/protocol/events.ts:16](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/events.ts#L16)

Parent span id, or `null` for a root span.

***

### traceId

```ts
readonly traceId: string;
```

Defined in: [packages/core/src/protocol/events.ts:18](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/events.ts#L18)

Trace id shared by every span in one logical run tree.
