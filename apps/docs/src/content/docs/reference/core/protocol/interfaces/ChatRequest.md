---
editUrl: false
next: false
prev: false
title: "ChatRequest"
---

Defined in: packages/core/src/protocol/provider.ts:44

The provider-agnostic semantic input for one model call.

## Properties

### messages

```ts
readonly messages: readonly Message[];
```

Defined in: packages/core/src/protocol/provider.ts:47

***

### model

```ts
readonly model: `${string}/${string}`;
```

Defined in: packages/core/src/protocol/provider.ts:45

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: packages/core/src/protocol/provider.ts:50

When set, the caller wants structured output (JSON mode) validated by this schema.

***

### system

```ts
readonly system: string;
```

Defined in: packages/core/src/protocol/provider.ts:46

***

### tools

```ts
readonly tools: readonly AnyTool<unknown>[];
```

Defined in: packages/core/src/protocol/provider.ts:48
