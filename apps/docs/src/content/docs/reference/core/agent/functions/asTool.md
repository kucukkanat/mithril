---
editUrl: false
next: false
prev: false
title: "asTool"
---

```ts
function asTool<In, ChildDeps, COut>(child, opts): Tool<string, In, COut, unknown>;
```

Defined in: [packages/core/src/agent/factory.ts:502](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L502)

Wrap an [Agent](/mithril/reference/core/agent/interfaces/agent/) as a [Tool](/mithril/reference/core/protocol/interfaces/tool/), so one agent can call another as a sub-agent.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `In` | the tool input type; defaults to `{ task: string }`. |
| `ChildDeps` | the sub-agent's dependency type. |
| `COut` *extends* [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | the sub-agent's output type, returned as the tool result. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `child` | [`Agent`](/mithril/reference/core/agent/interfaces/agent/)\<readonly [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`ChildDeps`\>[], `ChildDeps`, `COut`\> | the sub-agent to expose. |
| `opts` | [`AsToolOptions`](/mithril/reference/core/agent/interfaces/astooloptions/)\<`In`, `ChildDeps`\> | naming, schema, input mapping, and dependency wiring ([AsToolOptions](/mithril/reference/core/agent/interfaces/astooloptions/)). |

## Returns

[`Tool`](/mithril/reference/core/protocol/interfaces/tool/)\<`string`, `In`, `COut`, `unknown`\>

a [Tool](/mithril/reference/core/protocol/interfaces/tool/) whose `execute` runs the sub-agent to completion and returns its output.

## Remarks

**Inherited run context.** The sub-agent run automatically inherits the parent run's
`transport`, `providers`, and `runtime` (read from the calling [RunContext](/mithril/reference/core/protocol/interfaces/runcontext/)), so a nested agent
authenticates, resolves bare-string model ids, and uses the same runtime with no extra wiring. Supply the
child's own `deps` via [AsToolOptions.deps](/mithril/reference/core/agent/interfaces/astooloptions/#deps).

**Nested HITL is first-class.** If the sub-agent suspends (its own approval or `ctx.suspend`),
this tool suspends the *parent* via Tier-2 with a `handoff.suspended` request whose payload carries the
child's pending `child` descriptor. Resume the parent run with `{ kind: "resolve", value: <the child's
ResumeValue> }` (an `ApprovalDecision`, or `{ kind: "resolve", value }`): the tool resumes the child with
it, loops until the child finishes, and returns its output — all through the parent's own token, across as
many nested pauses as the child needs. The child run is journaled, so it is never re-executed on resume. A
sub-agent `error`/`cancel` surfaces as a [MithrilError](/mithril/reference/core/agent/classes/mithrilerror/) (`SUBAGENT_ERROR`/`SUBAGENT_CANCELLED`).

## Example

```ts
import { agent, asTool } from "@mithril/core/agent";

const researcher = agent({ model, instructions: "Research the question thoroughly." });
const lead = agent({
  model,
  instructions: "Delegate research, then summarize.",
  tools: [asTool(researcher, { name: "research", description: "Deep-dive a question." })],
});
```
