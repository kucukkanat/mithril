---
editUrl: false
next: false
prev: false
title: "harmonyRepair"
---

```ts
function harmonyRepair<Deps>(): Middleware<Deps>;
```

Defined in: [packages/core/src/agent/healing.ts:158](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/healing.ts#L158)

Model-altitude salvage: when the provider parsed NO tool calls but the model's text contains a leaked
tool call (its native tool grammar surfaced through the OpenAI-compat `content` channel instead of
`tool_calls` — e.g. gpt-oss "harmony" markers, or a stray `<tool_call>…</tool_call>` block), recover the
call, emit a visible `tool.repair` (`mechanism: "parse"`), and hand it back so the loop executes it. Only
names the agent actually exposes are salvaged, so a prose answer that merely mentions a tool is untouched.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | the agent's dependency bag (inferred; healing middleware are dependency-agnostic). |

## Returns

[`Middleware`](/reference/core/protocol/interfaces/middleware/)\<`Deps`\>
