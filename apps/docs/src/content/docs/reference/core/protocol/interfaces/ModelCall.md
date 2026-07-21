---
editUrl: false
next: false
prev: false
title: "ModelCall"
---

Defined in: packages/core/src/protocol/middleware.ts:46

The model-call input a [Middleware.model](/reference/core/protocol/interfaces/middleware/#model) wrapper observes or transforms.

## Properties

### messages

```ts
readonly messages: readonly Message[];
```

Defined in: packages/core/src/protocol/middleware.ts:49

***

### model

```ts
readonly model: `${string}/${string}`;
```

Defined in: packages/core/src/protocol/middleware.ts:47

***

### system

```ts
readonly system: string;
```

Defined in: packages/core/src/protocol/middleware.ts:48

***

### tools

```ts
readonly tools: readonly AnyTool<unknown>[];
```

Defined in: packages/core/src/protocol/middleware.ts:50
