---
editUrl: false
next: false
prev: false
title: "ToolCallRecord"
---

Defined in: [packages/core/src/protocol/state.ts:18](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/state.ts#L18)

A single tool call and its (eventual) output within a [Message](/reference/core/protocol/interfaces/message/).

## Properties

### callId

```ts
readonly callId: string;
```

Defined in: [packages/core/src/protocol/state.ts:19](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/state.ts#L19)

***

### input

```ts
readonly input: JsonValue;
```

Defined in: [packages/core/src/protocol/state.ts:21](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/state.ts#L21)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/state.ts:20](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/state.ts#L20)

***

### output?

```ts
readonly optional output?: JsonValue;
```

Defined in: [packages/core/src/protocol/state.ts:23](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/state.ts#L23)

Present once the corresponding `tool.result` has been reduced.
