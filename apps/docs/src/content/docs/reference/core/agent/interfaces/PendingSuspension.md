---
editUrl: false
next: false
prev: false
title: "PendingSuspension"
---

Defined in: [packages/core/src/agent/loop.ts:138](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L138)

The serialized description of what a suspended run is waiting on — enough to resume it in another
process. `approval` (Tier-1) resumes with an [ApprovalDecision](/mithril/reference/core/protocol/type-aliases/approvaldecision/); `return` (Tier-1b, a tool
returned `suspend(...)`) and `midtool` (Tier-2, `ctx.suspend()`) resume with a resolution value.

## Properties

### callId

```ts
readonly callId: string;
```

Defined in: [packages/core/src/agent/loop.ts:140](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L140)

***

### descriptor

```ts
readonly descriptor: SuspensionDescriptor;
```

Defined in: [packages/core/src/agent/loop.ts:141](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L141)

***

### journal?

```ts
readonly optional journal?: Readonly<Record<string, JsonValue>>;
```

Defined in: [packages/core/src/agent/loop.ts:143](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L143)

Tier-2 only: journaled effect values recorded before the pause, replayed on resume.

***

### kind

```ts
readonly kind: PendingKind;
```

Defined in: [packages/core/src/agent/loop.ts:139](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L139)

***

### resolutions?

```ts
readonly optional resolutions?: readonly JsonValue[];
```

Defined in: [packages/core/src/agent/loop.ts:145](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/loop.ts#L145)

Tier-2 only: resolutions consumed by prior `ctx.suspend()` calls, replayed in order on resume.
