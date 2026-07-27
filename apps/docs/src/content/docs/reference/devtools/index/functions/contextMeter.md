---
editUrl: false
next: false
prev: false
title: "contextMeter"
---

```ts
function contextMeter(state, opts?): ContextMeter;
```

Defined in: [packages/devtools/src/selectors.ts:145](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/devtools/src/selectors.ts#L145)

Project a RunState's usage into a [ContextMeter](/mithril/reference/devtools/index/interfaces/contextmeter/) for the cost/context display.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `state` | `RunState` | the run state (`replay(log)` of the events so far). |
| `opts?` | \{ `contextWindow?`: `number`; \} | `contextWindow` (model max tokens) enables the fill percentage/bar. |
| `opts.contextWindow?` | `number` | - |

## Returns

[`ContextMeter`](/mithril/reference/devtools/index/interfaces/contextmeter/)

tokens, cost, steps, and — when `contextWindow` is given — the fill `pct`.
