---
editUrl: false
next: false
prev: false
title: "SerializedError"
---

Defined in: packages/core/src/protocol/primitives.ts:63

A JSON-safe serialized form of a thrown error, suitable for the wire.

## Properties

### data?

```ts
readonly optional data?: JsonValue;
```

Defined in: packages/core/src/protocol/primitives.ts:69

Optional structured error detail.

***

### message

```ts
readonly message: string;
```

Defined in: packages/core/src/protocol/primitives.ts:65

***

### name

```ts
readonly name: string;
```

Defined in: packages/core/src/protocol/primitives.ts:64

***

### retryable?

```ts
readonly optional retryable?: boolean;
```

Defined in: packages/core/src/protocol/primitives.ts:67

Whether the operation may be retried; absent means unknown.
