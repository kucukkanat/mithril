---
editUrl: false
next: false
prev: false
title: "ModelResult"
---

Defined in: packages/core/src/protocol/middleware.ts:54

The result of one model invocation seen by a [Middleware.model](/reference/core/protocol/interfaces/middleware/#model) wrapper.

## Properties

### calls

```ts
readonly calls: readonly {
  callId: string;
  input: JsonValue;
  name: string;
}[];
```

Defined in: packages/core/src/protocol/middleware.ts:58

***

### finishReason

```ts
readonly finishReason: FinishReason;
```

Defined in: packages/core/src/protocol/middleware.ts:56

***

### text

```ts
readonly text: string;
```

Defined in: packages/core/src/protocol/middleware.ts:55

***

### usage

```ts
readonly usage: UsageDelta;
```

Defined in: packages/core/src/protocol/middleware.ts:57
