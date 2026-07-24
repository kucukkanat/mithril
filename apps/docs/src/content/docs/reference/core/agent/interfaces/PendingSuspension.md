---
editUrl: false
next: false
prev: false
title: "PendingSuspension"
---

Defined in: [packages/core/src/agent/loop.ts:111](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L111)

The serialized description of what a suspended run is waiting on — enough to resume it in another
process. `approval` (Tier-1) resumes with an [ApprovalDecision](/mithril/reference/core/protocol/type-aliases/approvaldecision/); `return` (Tier-1b, a tool
returned `suspend(...)`) and `midtool` (Tier-2, `ctx.suspend()`) resume with a resolution value.

## Properties

### callId

```ts
readonly callId: string;
```

Defined in: [packages/core/src/agent/loop.ts:113](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L113)

***

### descriptor

```ts
readonly descriptor: SuspensionDescriptor;
```

Defined in: [packages/core/src/agent/loop.ts:114](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L114)

***

### journal?

```ts
readonly optional journal?: Readonly<Record<string, JsonValue>>;
```

Defined in: [packages/core/src/agent/loop.ts:116](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L116)

Tier-2 only: journaled effect values recorded before the pause, replayed on resume.

***

### kind

```ts
readonly kind: PendingKind;
```

Defined in: [packages/core/src/agent/loop.ts:112](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L112)

***

### resolutions?

```ts
readonly optional resolutions?: readonly JsonValue[];
```

Defined in: [packages/core/src/agent/loop.ts:118](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L118)

Tier-2 only: resolutions consumed by prior `ctx.suspend()` calls, replayed in order on resume.
