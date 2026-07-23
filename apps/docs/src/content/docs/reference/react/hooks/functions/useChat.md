---
editUrl: false
next: false
prev: false
title: "useChat"
---

```ts
function useChat(agent): UseChatResult;
```

Defined in: [hooks.ts:83](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/react/src/hooks.ts#L83)

Subscribe a component to a multi-turn conversation with an agent — the industry-standard chat hook.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agent` | [`ChatAgent`](/reference/react/index/interfaces/chatagent/) | the agent to converse with (any Mithril `Agent` satisfies [ChatAgent](/reference/react/index/interfaces/chatagent/)). |

## Returns

[`UseChatResult`](/reference/react/hooks/interfaces/usechatresult/)

`{ messages, streaming, status, send }` — call `send(text)` to add a user turn and stream the reply.

## Remarks

A thin useSyncExternalStore wrapper over [createChatStore](/reference/react/index/functions/createchatstore/) (which holds the tested,
DOM-free logic). Memoizes the store on `agent` identity; pass a stable agent to preserve history across renders.

## Example

```tsx
function Chat({ assistant }: { assistant: Agent<[], void> }) {
  const { messages, streaming, status, send } = useChat(assistant);
  return (
    <>
      {messages.map((m, i) => <p key={i}><b>{m.role}:</b> {m.content}</p>)}
      {streaming && <p><b>assistant:</b> {streaming}▍</p>}
      <button disabled={status === "streaming"} onClick={() => send("Weather in NYC?")}>Ask</button>
    </>
  );
}
```
