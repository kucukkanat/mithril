---
editUrl: false
next: false
prev: false
title: "formatForModel"
---

```ts
function formatForModel(modelId): ToolFormat;
```

Defined in: [transformers/tool-formats.ts:171](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/providers/src/transformers/tool-formats.ts#L171)

Pick the [ToolFormat](/mithril/reference/providers/transformers/interfaces/toolformat/) for a model repo id: Gemma → native tokens, LFM2/Liquid → its Python-call
grammar, everything else → the `<tool_call>` grammar shared by Qwen/Granite.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `modelId` | `string` | the HF repo id (case-insensitive substring match). |

## Returns

[`ToolFormat`](/mithril/reference/providers/transformers/interfaces/toolformat/)

the format, defaulting to [angleToolCall](/mithril/reference/providers/transformers/variables/angletoolcall/).
