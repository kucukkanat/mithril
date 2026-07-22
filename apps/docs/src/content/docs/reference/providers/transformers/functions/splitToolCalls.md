---
editUrl: false
next: false
prev: false
title: "splitToolCalls"
---

```ts
function splitToolCalls(tokens, fmt): AsyncGenerator<EngineChunk>;
```

Defined in: [transformers/tool-formats.ts:194](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/tool-formats.ts#L194)

Transform a raw token stream into [EngineChunk](/reference/providers/transformers/type-aliases/enginechunk/)s, suppressing tool-call sentinels from visible text.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokens` | `AsyncIterable`\<`string`\> | the model's decoded token stream (whole-word chunks from `TextStreamer`). |
| `fmt` | \| [`ToolFormat`](/reference/providers/transformers/interfaces/toolformat/) \| `undefined` | the tool grammar; `undefined` passes tokens through as text (no tool detection). |

## Returns

`AsyncGenerator`\<[`EngineChunk`](/reference/providers/transformers/type-aliases/enginechunk/)\>

an async stream of `text` chunks (sentinels stripped) and fully-parsed `toolCall` chunks.

## Remarks

Holds back up to `start.length - 1` trailing chars while scanning so a sentinel split across two
tokens never leaks as visible text. Fail-soft: an unterminated or malformed call yields no crash.
