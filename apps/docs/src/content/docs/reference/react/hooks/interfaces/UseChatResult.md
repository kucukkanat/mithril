---
editUrl: false
next: false
prev: false
title: "UseChatResult"
---

Defined in: [hooks.ts:57](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/react/src/hooks.ts#L57)

The value returned by [useChat](/reference/react/hooks/functions/usechat/): the current [ChatSnapshot](/reference/react/index/interfaces/chatsnapshot/) plus a `send` action.

## Extends

- [`ChatSnapshot`](/reference/react/index/interfaces/chatsnapshot/)

## Properties

### messages

```ts
readonly messages: readonly ChatMessage[];
```

Defined in: [index.ts:121](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/react/src/index.ts#L121)

#### Inherited from

[`ChatSnapshot`](/reference/react/index/interfaces/chatsnapshot/).[`messages`](/reference/react/index/interfaces/chatsnapshot/#messages)

***

### status

```ts
readonly status: "error" | "streaming" | "idle";
```

Defined in: [index.ts:123](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/react/src/index.ts#L123)

#### Inherited from

[`ChatSnapshot`](/reference/react/index/interfaces/chatsnapshot/).[`status`](/reference/react/index/interfaces/chatsnapshot/#status)

***

### streaming

```ts
readonly streaming: string;
```

Defined in: [index.ts:122](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/react/src/index.ts#L122)

#### Inherited from

[`ChatSnapshot`](/reference/react/index/interfaces/chatsnapshot/).[`streaming`](/reference/react/index/interfaces/chatsnapshot/#streaming)

## Methods

### send()

```ts
send(input): void;
```

Defined in: [hooks.ts:59](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/react/src/hooks.ts#L59)

Append a user message and stream the assistant's reply. Ignored while a reply is streaming.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |

#### Returns

`void`
