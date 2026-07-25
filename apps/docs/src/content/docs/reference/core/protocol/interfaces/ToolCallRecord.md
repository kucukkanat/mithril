---
editUrl: false
next: false
prev: false
title: "ToolCallRecord"
---

Defined in: [packages/core/src/protocol/state.ts:20](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/state.ts#L20)

A single tool call and its (eventual) output within a [Message](/mithril/reference/core/protocol/interfaces/message/).

## Properties

### callId

```ts
readonly callId: string;
```

Defined in: [packages/core/src/protocol/state.ts:21](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/state.ts#L21)

***

### input

```ts
readonly input: JsonValue;
```

Defined in: [packages/core/src/protocol/state.ts:23](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/state.ts#L23)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/state.ts:22](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/state.ts#L22)

***

### output?

```ts
readonly optional output?: JsonValue;
```

Defined in: [packages/core/src/protocol/state.ts:25](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/state.ts#L25)

Present once the corresponding `tool.result` has been reduced.
