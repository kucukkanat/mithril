---
editUrl: false
next: false
prev: false
title: "formatForModel"
---

```ts
function formatForModel(modelId): ToolFormat;
```

Defined in: [transformers/tool-formats.ts:171](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/providers/src/transformers/tool-formats.ts#L171)

Pick the [ToolFormat](/reference/providers/transformers/interfaces/toolformat/) for a model repo id: Gemma → native tokens, LFM2/Liquid → its Python-call
grammar, everything else → the `<tool_call>` grammar shared by Qwen/Granite.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `modelId` | `string` | the HF repo id (case-insensitive substring match). |

## Returns

[`ToolFormat`](/reference/providers/transformers/interfaces/toolformat/)

the format, defaulting to [angleToolCall](/reference/providers/transformers/variables/angletoolcall/).
