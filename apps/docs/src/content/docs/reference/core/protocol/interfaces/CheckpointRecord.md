---
editUrl: false
next: false
prev: false
title: "CheckpointRecord"
---

Defined in: packages/core/src/protocol/checkpointer.ts:10

One persisted checkpoint in a run's history — an opaque run token plus routing metadata.

## Properties

### checkpointId

```ts
readonly checkpointId: string;
```

Defined in: packages/core/src/protocol/checkpointer.ts:13

Monotonic ULID, `getRandomValues`-derived so it is insecure-context safe.

***

### createdAt

```ts
readonly createdAt: string;
```

Defined in: packages/core/src/protocol/checkpointer.ts:19

***

### parentId

```ts
readonly parentId: string | null;
```

Defined in: packages/core/src/protocol/checkpointer.ts:15

The prior checkpoint id this one descends from, or `null` for the first.

***

### pending?

```ts
readonly optional pending?: SuspensionDescriptor;
```

Defined in: packages/core/src/protocol/checkpointer.ts:21

Unsealed, non-sensitive pending suspension — lets a UI render "awaiting approval" without opening the token.

***

### runId

```ts
readonly runId: string;
```

Defined in: packages/core/src/protocol/checkpointer.ts:11

***

### status

```ts
readonly status: string;
```

Defined in: packages/core/src/protocol/checkpointer.ts:18

***

### token

```ts
readonly token: string | null;
```

Defined in: packages/core/src/protocol/checkpointer.ts:17

Opaque (sealed or unsigned) state blob; `null` when unsealable.
