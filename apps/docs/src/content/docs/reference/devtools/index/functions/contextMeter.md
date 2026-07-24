---
editUrl: false
next: false
prev: false
title: "contextMeter"
---

```ts
function contextMeter(state, opts?): ContextMeter;
```

Defined in: [packages/devtools/src/selectors.ts:141](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/devtools/src/selectors.ts#L141)

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
