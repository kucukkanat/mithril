---
editUrl: false
next: false
prev: false
title: "ModelMessage"
---

Defined in: [packages/core/src/protocol/state.ts:40](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/state.ts#L40)

A message at the model-call boundary — like [Message](/mithril/reference/core/protocol/interfaces/message/), but `content` may carry multimodal
[ContentPart](/mithril/reference/core/protocol/type-aliases/contentpart/)s (images/files) in addition to plain text. The loop threads these to providers; the
reducer's [Message](/mithril/reference/core/protocol/interfaces/message/) keeps a flattened `string` content for state/observability.

## Properties

### content

```ts
readonly content: 
  | string
  | readonly ContentPart[];
```

Defined in: [packages/core/src/protocol/state.ts:42](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/state.ts#L42)

***

### role

```ts
readonly role: string;
```

Defined in: [packages/core/src/protocol/state.ts:41](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/state.ts#L41)

***

### toolCalls

```ts
readonly toolCalls: readonly ToolCallRecord[];
```

Defined in: [packages/core/src/protocol/state.ts:43](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/state.ts#L43)
