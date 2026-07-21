---
editUrl: false
next: false
prev: false
title: "splitToolCalls"
---

```ts
function splitToolCalls(tokens, fmt): AsyncGenerator<EngineChunk>;
```

Defined in: transformers/tool-formats.ts:194

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
