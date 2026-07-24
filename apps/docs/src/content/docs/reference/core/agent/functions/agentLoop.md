---
editUrl: false
next: false
prev: false
title: "agentLoop"
---

```ts
function agentLoop<Deps>(opts): AsyncGenerator<MithrilEvent, RunResult<JsonValue>>;
```

Defined in: [packages/core/src/agent/loop.ts:317](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L317)

The core streaming agent loop: drives model turns and tool execution, emitting [MithrilEvent](/mithril/reference/core/protocol/type-aliases/mithrilevent/)s and
returning a terminal [RunResult](/mithril/reference/core/agent/type-aliases/runresult/).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency object injected into tool/instruction contexts. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`LoopOptions`](/mithril/reference/core/agent/interfaces/loopoptions/)\<`Deps`\> | the resolved [LoopOptions](/mithril/reference/core/agent/interfaces/loopoptions/). |

## Returns

`AsyncGenerator`\<[`MithrilEvent`](/mithril/reference/core/protocol/type-aliases/mithrilevent/), [`RunResult`](/mithril/reference/core/agent/type-aliases/runresult/)\<[`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/)\>\>

an `AsyncGenerator` that yields every run event and finally returns the [RunResult](/mithril/reference/core/agent/type-aliases/runresult/). The
result's `output` is typed as `JsonValue` here; [agent](/mithril/reference/core/agent/functions/agent/) narrows it to the config's `Out`.

## Throws

[MithrilError](/mithril/reference/core/agent/classes/mithrilerror/) on unresolvable model/provider or invalid tool input (`INVALID_TOOL_INPUT`).

## Remarks

Each iteration is one step (bounded by `maxSteps`, default 16). A step calls the model, streams
its chunks, then either finishes (text or validated structured output), runs the requested tool calls, or
suspends. Three suspension tiers are wired: Tier-1 approval (`needsApproval`), Tier-1b (a tool returns
`suspend(...)`), and Tier-2 (`ctx.suspend()` mid-execute, resumed by replaying journaled effects).
Middleware wraps both the model call and each tool invocation. Consumers see every stamped event.
Aborting `opts.signal` returns a `"cancelled"` result at the next step boundary.

## Example

```ts
import { agentLoop } from "@mithril/core/agent";

const gen = agentLoop({
  model: myModelHandle,
  instructions: "Be brief.",
  tools: [],
  input: "Hello",
  deps: undefined,
});
for (;;) {
  const next = await gen.next();
  if (next.done) {
    console.log("result:", next.value);
    break;
  }
  console.log("event:", next.value.type);
}
```
