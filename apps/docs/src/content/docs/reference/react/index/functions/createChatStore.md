---
editUrl: false
next: false
prev: false
title: "createChatStore"
---

```ts
function createChatStore(agent): ChatStore;
```

Defined in: [index.ts:151](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/react/src/index.ts#L151)

Build a framework-agnostic multi-turn [ChatStore](/mithril/reference/react/index/interfaces/chatstore/) over an agent — the DOM-free core that
useChat wraps, so the conversation logic is tested without React.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agent` | [`ChatAgent`](/mithril/reference/react/index/interfaces/chatagent/) | the agent to converse with (a Mithril `Agent` satisfies [ChatAgent](/mithril/reference/react/index/interfaces/chatagent/)). |

## Returns

[`ChatStore`](/mithril/reference/react/index/interfaces/chatstore/)

a store exposing `subscribe`, `getSnapshot`, and `send`.

## Remarks

On `send`, appends the user message, streams `agent.stream(history)` while accumulating the
assistant's `text.delta`s into `streaming`, then commits the assistant turn to `messages`. Concurrent
`send`s while a reply is streaming are ignored. A `run.error` (or a thrown stream) settles `status: "error"`.
