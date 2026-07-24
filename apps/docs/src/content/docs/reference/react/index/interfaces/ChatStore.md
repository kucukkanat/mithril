---
editUrl: false
next: false
prev: false
title: "ChatStore"
---

Defined in: [index.ts:132](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/react/src/index.ts#L132)

A `useSyncExternalStore`-compatible chat store with a `send` action. Created by [createChatStore](/mithril/reference/react/index/functions/createchatstore/).

## Methods

### getSnapshot()

```ts
getSnapshot(): ChatSnapshot;
```

Defined in: [index.ts:134](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/react/src/index.ts#L134)

#### Returns

[`ChatSnapshot`](/mithril/reference/react/index/interfaces/chatsnapshot/)

***

### send()

```ts
send(input): void;
```

Defined in: [index.ts:136](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/react/src/index.ts#L136)

Append a user message and stream the assistant's reply, accumulating history. Ignored mid-stream.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |

#### Returns

`void`

***

### subscribe()

```ts
subscribe(onChange): () => void;
```

Defined in: [index.ts:133](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/react/src/index.ts#L133)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `onChange` | () => `void` |

#### Returns

() => `void`
