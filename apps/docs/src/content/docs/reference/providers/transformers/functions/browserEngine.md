---
editUrl: false
next: false
prev: false
title: "browserEngine"
---

```ts
function browserEngine(opts?): TransformersEngine;
```

Defined in: [transformers/edge.ts:253](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/providers/src/transformers/edge.ts#L253)

Build the browser [TransformersEngine](/mithril/reference/providers/transformers/interfaces/transformersengine/) backing a [transformers](/mithril/reference/providers/transformers/functions/transformers/) handle.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts?` | [`EdgeOptions`](/mithril/reference/providers/transformers/interfaces/edgeoptions/) | device/dtype/progress ([EdgeOptions](/mithril/reference/providers/transformers/interfaces/edgeoptions/)); omit to feature-detect WebGPU → CPU (Node/Bun) / WASM (browser). |

## Returns

[`TransformersEngine`](/mithril/reference/providers/transformers/interfaces/transformersengine/)

an engine that loads (cached) the requested model, streams tokens, and parses tool calls per model.

## Remarks

Runtime-verified in a real WebGPU browser only (the pure core + parser carry the unit tests). Text
streams cleanly (special tokens skipped); the literal `<tool_call>` grammar (Qwen/Granite/Qwen3.5) is
detected in-stream — Gemma-4's special-token tool format is best-effort pending raw-token decode.
