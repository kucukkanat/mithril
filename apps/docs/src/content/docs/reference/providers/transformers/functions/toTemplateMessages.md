---
editUrl: false
next: false
prev: false
title: "toTemplateMessages"
---

```ts
function toTemplateMessages(
   system, 
   messages, 
   format): TemplateMessage[];
```

Defined in: [transformers/tool-formats.ts:236](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/tool-formats.ts#L236)

Project a run's message history into the `{ role, content }` turns a local chat template consumes.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `system` | `string` | the agent's instructions; omitted from the output when empty. |
| `messages` | readonly \{ `content`: `string`; `role`: `string`; `toolCalls`: readonly \{ `input`: `JsonValue`; `name`: `string`; \}[]; \}[] | the loop's history, whose assistant turns carry structured `toolCalls`. |
| `format` | \| [`ToolFormat`](/mithril/reference/providers/transformers/interfaces/toolformat/) \| `undefined` | the model family's grammar, or `undefined` when the run declares no tools. |

## Returns

[`TemplateMessage`](/mithril/reference/providers/transformers/interfaces/templatemessage/)[]

template turns in which each tool-calling assistant turn re-states its calls in `format`'s grammar.

## Remarks

A local chat template only ever sees `role` + `content`, so structured `toolCalls` would simply
vanish — leaving step 2 with a `tool` result and no record of the call that produced it, which is what
small models answer by inventing. Re-rendering the calls into the SAME grammar the model emits (and the
parser reads) makes the replayed turn indistinguishable from the model's own output.

## Example

```ts
toTemplateMessages("", [{ role: "assistant", content: "", toolCalls: [{ callId: "c0", name: "weather", input: { city: "NYC" } }] }], liquidToolCall);
// → [{ role: "assistant", content: '<|tool_call_start|>[weather(city="NYC")]<|tool_call_end|>' }]
```
