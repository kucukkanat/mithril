---
editUrl: false
next: false
prev: false
title: "formatForModel"
---

```ts
function formatForModel(modelId): ToolFormat;
```

Defined in: [transformers/tool-formats.ts:205](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/providers/src/transformers/tool-formats.ts#L205)

Pick the [ToolFormat](/mithril/reference/providers/transformers/interfaces/toolformat/) for a model repo id: Gemma → native tokens, LFM2/Liquid → its Python-call
grammar, everything else → the `<tool_call>` grammar shared by Qwen/Granite.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `modelId` | `string` | the HF repo id (case-insensitive substring match). |

## Returns

[`ToolFormat`](/mithril/reference/providers/transformers/interfaces/toolformat/)

the format, defaulting to [angleToolCall](/mithril/reference/providers/transformers/variables/angletoolcall/).
