---
editUrl: false
next: false
prev: false
title: "formatForModel"
---

```ts
function formatForModel(modelId): ToolFormat;
```

Defined in: [transformers/tool-formats.ts:205](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/tool-formats.ts#L205)

Pick the [ToolFormat](/mithril/reference/providers/transformers/interfaces/toolformat/) for a model repo id: Gemma → native tokens, LFM2/Liquid → its Python-call
grammar, everything else → the `<tool_call>` grammar shared by Qwen/Granite.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `modelId` | `string` | the HF repo id (case-insensitive substring match). |

## Returns

[`ToolFormat`](/mithril/reference/providers/transformers/interfaces/toolformat/)

the format, defaulting to [angleToolCall](/mithril/reference/providers/transformers/variables/angletoolcall/).
