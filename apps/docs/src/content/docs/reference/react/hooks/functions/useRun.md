---
editUrl: false
next: false
prev: false
title: "useRun"
---

```ts
function useRun(source): RunSnapshot;
```

Defined in: hooks.ts:43

Subscribe a component to a streaming run and re-render as events arrive.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | [`RunSource`](/reference/react/hooks/interfaces/runsource/) | A [RunSource](/reference/react/hooks/interfaces/runsource/), e.g. `agent.stream(input)`. |

## Returns

[`RunSnapshot`](/reference/react/index/interfaces/runsnapshot/)

The current [RunSnapshot](/reference/react/index/interfaces/runsnapshot/), updated on each event.

## Remarks

Memoizes the store on `source` identity; pass a stable handle to avoid re-subscribing every render.

## Example

```tsx
function Chat({ run }: { run: RunSource }) {
  const { text, status, costUsd } = useRun(run);
  return <pre>{text}{status === "streaming" ? "▍" : ` — $${costUsd.toFixed(4)}`}</pre>;
}
```
