---
editUrl: false
next: false
prev: false
title: "splitToolCalls"
---

```ts
function splitToolCalls(
   tokens, 
   fmt, 
reasoning?): AsyncGenerator<EngineChunk>;
```

Defined in: [transformers/tool-formats.ts:217](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/transformers/tool-formats.ts#L217)

Transform a raw token stream into [EngineChunk](/mithril/reference/providers/transformers/type-aliases/enginechunk/)s, suppressing tool-call and reasoning sentinels from
visible text.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokens` | `AsyncIterable`\<`string`\> | the model's decoded token stream (whole-word chunks from `TextStreamer`). |
| `fmt` | \| [`ToolFormat`](/mithril/reference/providers/transformers/interfaces/toolformat/) \| `undefined` | the tool grammar; `undefined` disables tool detection. |
| `reasoning?` | `ReasoningFormat` | the reasoning grammar; `undefined` disables reasoning detection (so `<think>` content, if any, stays in the visible text — the exact legacy behavior). When set, a `<think>…</think>` block is routed to `reasoning` chunks (→ the generic `reasoning.delta` channel) instead of leaking into the answer. |

## Returns

`AsyncGenerator`\<[`EngineChunk`](/mithril/reference/providers/transformers/type-aliases/enginechunk/)\>

an async stream of `token` chunks (answer text), `reasoning` chunks, and parsed `toolCall` chunks.

## Remarks

Single pass. Holds back up to the longest active sentinel's `length - 1` trailing chars while
scanning so a sentinel split across two tokens never leaks. Fail-soft: an unterminated or malformed block
yields no crash. Assumes reasoning precedes tool calls within one generation (true for open models).
