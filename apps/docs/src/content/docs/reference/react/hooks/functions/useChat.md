---
editUrl: false
next: false
prev: false
title: "useChat"
---

```ts
function useChat(agent): UseChatResult;
```

Defined in: [hooks.ts:83](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/react/src/hooks.ts#L83)

Subscribe a component to a multi-turn conversation with an agent — the industry-standard chat hook.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agent` | [`ChatAgent`](/mithril/reference/react/index/interfaces/chatagent/) | the agent to converse with (any Mithril `Agent` satisfies [ChatAgent](/mithril/reference/react/index/interfaces/chatagent/)). |

## Returns

[`UseChatResult`](/mithril/reference/react/hooks/interfaces/usechatresult/)

`{ messages, streaming, status, send }` — call `send(text)` to add a user turn and stream the reply.

## Remarks

A thin useSyncExternalStore wrapper over [createChatStore](/mithril/reference/react/index/functions/createchatstore/) (which holds the tested,
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
