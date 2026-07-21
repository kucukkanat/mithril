---
editUrl: false
next: false
prev: false
title: "ToolCallRecord"
---

Defined in: packages/core/src/protocol/state.ts:18

A single tool call and its (eventual) output within a [Message](/reference/core/protocol/interfaces/message/).

## Properties

### callId

```ts
readonly callId: string;
```

Defined in: packages/core/src/protocol/state.ts:19

***

### input

```ts
readonly input: JsonValue;
```

Defined in: packages/core/src/protocol/state.ts:21

***

### name

```ts
readonly name: string;
```

Defined in: packages/core/src/protocol/state.ts:20

***

### output?

```ts
readonly optional output?: JsonValue;
```

Defined in: packages/core/src/protocol/state.ts:23

Present once the corresponding `tool.result` has been reduced.
