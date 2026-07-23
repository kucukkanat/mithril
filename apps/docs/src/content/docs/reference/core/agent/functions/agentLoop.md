---
editUrl: false
next: false
prev: false
title: "agentLoop"
---

```ts
function agentLoop<Deps>(opts): AsyncGenerator<MithrilEvent, RunResult<JsonValue>>;
```

Defined in: [packages/core/src/agent/loop.ts:361](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/loop.ts#L361)

The core streaming agent loop: drives model turns and tool execution, emitting [MithrilEvent](/reference/core/protocol/type-aliases/mithrilevent/)s and
returning a terminal [RunResult](/reference/core/agent/type-aliases/runresult/).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency object injected into tool/instruction contexts. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`LoopOptions`](/reference/core/agent/interfaces/loopoptions/)\<`Deps`\> | the resolved [LoopOptions](/reference/core/agent/interfaces/loopoptions/). |

## Returns

`AsyncGenerator`\<[`MithrilEvent`](/reference/core/protocol/type-aliases/mithrilevent/), [`RunResult`](/reference/core/agent/type-aliases/runresult/)\<[`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/)\>\>

an `AsyncGenerator` that yields every run event and finally returns the [RunResult](/reference/core/agent/type-aliases/runresult/). The
result's `output` is typed as `JsonValue` here; [agent](/reference/core/agent/functions/agent/) narrows it to the config's `Out`.

## Throws

[MithrilError](/reference/core/agent/classes/mithrilerror/) on unresolvable model/provider or invalid tool input (`INVALID_TOOL_INPUT`).

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
