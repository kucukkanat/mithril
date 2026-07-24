---
editUrl: false
next: false
prev: false
title: "ToolCallRecord"
---

Defined in: [packages/core/src/protocol/state.ts:18](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/state.ts#L18)

A single tool call and its (eventual) output within a [Message](/mithril/reference/core/protocol/interfaces/message/).

## Properties

### callId

```ts
readonly callId: string;
```

Defined in: [packages/core/src/protocol/state.ts:19](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/state.ts#L19)

***

### input

```ts
readonly input: JsonValue;
```

Defined in: [packages/core/src/protocol/state.ts:21](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/state.ts#L21)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/state.ts:20](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/state.ts#L20)

***

### output?

```ts
readonly optional output?: JsonValue;
```

Defined in: [packages/core/src/protocol/state.ts:23](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/state.ts#L23)

Present once the corresponding `tool.result` has been reduced.
