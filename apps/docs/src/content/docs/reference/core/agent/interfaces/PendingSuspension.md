---
editUrl: false
next: false
prev: false
title: "PendingSuspension"
---

Defined in: [packages/core/src/agent/loop.ts:64](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/loop.ts#L64)

The serialized description of what a suspended run is waiting on — enough to resume it in another
process. `approval` (Tier-1) resumes with an [ApprovalDecision](/reference/core/protocol/type-aliases/approvaldecision/); `return` (Tier-1b, a tool
returned `suspend(...)`) and `midtool` (Tier-2, `ctx.suspend()`) resume with a resolution value.

## Properties

### callId

```ts
readonly callId: string;
```

Defined in: [packages/core/src/agent/loop.ts:66](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/loop.ts#L66)

***

### descriptor

```ts
readonly descriptor: SuspensionDescriptor;
```

Defined in: [packages/core/src/agent/loop.ts:67](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/loop.ts#L67)

***

### journal?

```ts
readonly optional journal?: Readonly<Record<string, JsonValue>>;
```

Defined in: [packages/core/src/agent/loop.ts:69](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/loop.ts#L69)

Tier-2 only: journaled effect values recorded before the pause, replayed on resume.

***

### kind

```ts
readonly kind: PendingKind;
```

Defined in: [packages/core/src/agent/loop.ts:65](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/loop.ts#L65)

***

### resolutions?

```ts
readonly optional resolutions?: readonly JsonValue[];
```

Defined in: [packages/core/src/agent/loop.ts:71](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/loop.ts#L71)

Tier-2 only: resolutions consumed by prior `ctx.suspend()` calls, replayed in order on resume.
