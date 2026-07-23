---
editUrl: false
next: false
prev: false
title: "ChatAgent"
---

Defined in: [index.ts:127](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/react/src/index.ts#L127)

The minimal agent shape [createChatStore](/reference/react/index/functions/createchatstore/) needs: `stream(history)` yielding a run's events.

## Methods

### stream()

```ts
stream(input): {
  events: AsyncIterable<MithrilEvent>;
};
```

Defined in: [index.ts:128](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/react/src/index.ts#L128)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | readonly [`ChatMessage`](/reference/react/index/interfaces/chatmessage/)[] |

#### Returns

```ts
{
  events: AsyncIterable<MithrilEvent>;
}
```

##### events

```ts
readonly events: AsyncIterable<MithrilEvent>;
```
