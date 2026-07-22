---
editUrl: false
next: false
prev: false
title: "ChatSnapshot"
---

Defined in: [index.ts:120](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/react/src/index.ts#L120)

An immutable view of a chat: completed `messages`, the in-flight assistant `streaming` text, and `status`.

## Extended by

- [`UseChatResult`](/reference/react/hooks/interfaces/usechatresult/)

## Properties

### messages

```ts
readonly messages: readonly ChatMessage[];
```

Defined in: [index.ts:121](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/react/src/index.ts#L121)

***

### status

```ts
readonly status: "error" | "streaming" | "idle";
```

Defined in: [index.ts:123](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/react/src/index.ts#L123)

***

### streaming

```ts
readonly streaming: string;
```

Defined in: [index.ts:122](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/react/src/index.ts#L122)
