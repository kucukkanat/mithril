---
editUrl: false
next: false
prev: false
title: "PendingSuspension"
---

Defined in: [packages/core/src/agent/loop.ts:76](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/loop.ts#L76)

The serialized description of what a suspended run is waiting on — enough to resume it in another
process. `approval` (Tier-1) resumes with an [ApprovalDecision](/reference/core/protocol/type-aliases/approvaldecision/); `return` (Tier-1b, a tool
returned `suspend(...)`) and `midtool` (Tier-2, `ctx.suspend()`) resume with a resolution value.

## Properties

### callId

```ts
readonly callId: string;
```

Defined in: [packages/core/src/agent/loop.ts:78](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/loop.ts#L78)

***

### descriptor

```ts
readonly descriptor: SuspensionDescriptor;
```

Defined in: [packages/core/src/agent/loop.ts:79](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/loop.ts#L79)

***

### journal?

```ts
readonly optional journal?: Readonly<Record<string, JsonValue>>;
```

Defined in: [packages/core/src/agent/loop.ts:81](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/loop.ts#L81)

Tier-2 only: journaled effect values recorded before the pause, replayed on resume.

***

### kind

```ts
readonly kind: PendingKind;
```

Defined in: [packages/core/src/agent/loop.ts:77](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/loop.ts#L77)

***

### resolutions?

```ts
readonly optional resolutions?: readonly JsonValue[];
```

Defined in: [packages/core/src/agent/loop.ts:83](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/loop.ts#L83)

Tier-2 only: resolutions consumed by prior `ctx.suspend()` calls, replayed in order on resume.
