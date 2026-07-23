---
editUrl: false
next: false
prev: false
title: "useRun"
---

```ts
function useRun(source): RunSnapshot;
```

Defined in: [hooks.ts:44](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/react/src/hooks.ts#L44)

Subscribe a component to a streaming run and re-render as events arrive.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | [`RunSource`](/reference/react/hooks/interfaces/runsource/) \| `undefined` | A [RunSource](/reference/react/hooks/interfaces/runsource/), e.g. `agent.stream(input)`, or `undefined` before a run has started (the hook then reports an empty idle snapshot, so it can be called unconditionally per the rules of hooks). |

## Returns

[`RunSnapshot`](/reference/react/index/interfaces/runsnapshot/)

The current [RunSnapshot](/reference/react/index/interfaces/runsnapshot/), updated on each event.

## Remarks

Memoizes the store on `source` identity; pass a stable handle to avoid re-subscribing every render.

## Example

```tsx
function Chat({ run }: { run: RunSource | undefined }) {
  const { text, status, costUsd } = useRun(run); // safe before the first run: run === undefined
  return <pre>{text}{status === "streaming" ? "▍" : ` — $${costUsd.toFixed(4)}`}</pre>;
}
```
