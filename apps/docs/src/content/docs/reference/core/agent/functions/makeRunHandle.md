---
editUrl: false
next: false
prev: false
title: "makeRunHandle"
---

```ts
function makeRunHandle<Out>(
   gen, 
   runId, 
controls): RunHandle<Out>;
```

Defined in: [packages/core/src/agent/handle.ts:27](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/handle.ts#L27)

Wrap the loop generator in a [RunHandle](/mithril/reference/core/agent/interfaces/runhandle/) backed by a buffered broadcast.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Out` | `string` | the run output type, resolved by [RunHandle.result](/mithril/reference/core/agent/interfaces/runhandle/#result). |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `gen` | `AsyncGenerator`\<[`MithrilEvent`](/mithril/reference/core/protocol/type-aliases/mithrilevent/), [`RunResult`](/mithril/reference/core/agent/type-aliases/runresult/)\<`Out`\>\> | the [agentLoop](/mithril/reference/core/agent/functions/agentloop/) generator to drive; it is consumed eagerly into a shared buffer so every subscriber (`events`, `text`, the handle itself) replays the full stream independently. |
| `runId` | `string` | the run's id, surfaced as [RunHandle.runId](/mithril/reference/core/agent/interfaces/runhandle/#runid). |
| `controls` | `HandleControls`\<`Out`\> | HandleControls wiring `cancel()` (abort) and `resolve()` (streaming resume). |

## Returns

[`RunHandle`](/mithril/reference/core/agent/interfaces/runhandle/)\<`Out`\>

a [RunHandle](/mithril/reference/core/agent/interfaces/runhandle/) whose `state()` replays the events buffered so far and whose `result()`
resolves with the terminal [RunResult](/mithril/reference/core/agent/type-aliases/runresult/) (or rejects if the loop throws).
