---
editUrl: false
next: false
prev: false
title: "asTool"
---

```ts
function asTool<In, ChildDeps, COut>(child, opts): Tool<string, In, COut, unknown>;
```

Defined in: packages/core/src/agent/factory.ts:411

Wrap an [Agent](/reference/core/agent/interfaces/agent/) as a [Tool](/reference/core/protocol/interfaces/tool/), so one agent can call another as a sub-agent.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `In` | the tool input type; defaults to `{ task: string }`. |
| `ChildDeps` | the sub-agent's dependency type. |
| `COut` *extends* [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | the sub-agent's output type, returned as the tool result. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `child` | [`Agent`](/reference/core/agent/interfaces/agent/)\<readonly [`AnyTool`](/reference/core/protocol/type-aliases/anytool/)\<`ChildDeps`\>[], `ChildDeps`, `COut`\> | the sub-agent to expose. |
| `opts` | [`AsToolOptions`](/reference/core/agent/interfaces/astooloptions/)\<`In`, `ChildDeps`\> | naming, schema, input mapping, and dependency wiring ([AsToolOptions](/reference/core/agent/interfaces/astooloptions/)). |

## Returns

[`Tool`](/reference/core/protocol/interfaces/tool/)\<`string`, `In`, `COut`, `unknown`\>

a [Tool](/reference/core/protocol/interfaces/tool/) whose `execute` runs the sub-agent to completion and returns its output.

## Remarks

**Nested HITL is first-class.** If the sub-agent suspends (its own approval or `ctx.suspend`),
this tool suspends the *parent* via Tier-2 with a `handoff.suspended` request whose payload carries the
child's pending `child` descriptor. Resume the parent run with `{ kind: "resolve", value: <the child's
ResumeValue> }` (an `ApprovalDecision`, or `{ kind: "resolve", value }`): the tool resumes the child with
it, loops until the child finishes, and returns its output — all through the parent's own token, across as
many nested pauses as the child needs. The child run is journaled, so it is never re-executed on resume. A
sub-agent `error`/`cancel` surfaces as a [MithrilError](/reference/core/agent/classes/mithrilerror/) (`SUBAGENT_ERROR`/`SUBAGENT_CANCELLED`).

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
