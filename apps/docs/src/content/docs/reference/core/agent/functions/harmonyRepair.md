---
editUrl: false
next: false
prev: false
title: "harmonyRepair"
---

```ts
function harmonyRepair<Deps>(): Middleware<Deps>;
```

Defined in: [packages/core/src/agent/healing.ts:178](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/healing.ts#L178)

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

[`Middleware`](/mithril/reference/core/protocol/interfaces/middleware/)\<`Deps`\>
