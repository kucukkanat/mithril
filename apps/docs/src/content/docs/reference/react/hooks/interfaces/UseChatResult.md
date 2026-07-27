---
editUrl: false
next: false
prev: false
title: "UseChatResult"
---

Defined in: [hooks.ts:57](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/react/src/hooks.ts#L57)

The value returned by [useChat](/mithril/reference/react/hooks/functions/usechat/): the current [ChatSnapshot](/mithril/reference/react/index/interfaces/chatsnapshot/) plus a `send` action.

## Extends

- [`ChatSnapshot`](/mithril/reference/react/index/interfaces/chatsnapshot/)

## Properties

### messages

```ts
readonly messages: readonly ChatMessage[];
```

Defined in: [index.ts:121](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/react/src/index.ts#L121)

#### Inherited from

[`ChatSnapshot`](/mithril/reference/react/index/interfaces/chatsnapshot/).[`messages`](/mithril/reference/react/index/interfaces/chatsnapshot/#messages)

***

### status

```ts
readonly status: "error" | "streaming" | "idle";
```

Defined in: [index.ts:123](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/react/src/index.ts#L123)

#### Inherited from

[`ChatSnapshot`](/mithril/reference/react/index/interfaces/chatsnapshot/).[`status`](/mithril/reference/react/index/interfaces/chatsnapshot/#status)

***

### streaming

```ts
readonly streaming: string;
```

Defined in: [index.ts:122](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/react/src/index.ts#L122)

#### Inherited from

[`ChatSnapshot`](/mithril/reference/react/index/interfaces/chatsnapshot/).[`streaming`](/mithril/reference/react/index/interfaces/chatsnapshot/#streaming)

## Methods

### send()

```ts
send(input): void;
```

Defined in: [hooks.ts:59](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/react/src/hooks.ts#L59)

Append a user message and stream the assistant's reply. Ignored while a reply is streaming.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |

#### Returns

`void`
