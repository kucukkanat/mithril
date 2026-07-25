---
editUrl: false
next: false
prev: false
title: "transformers"
---

```ts
function transformers(model?, opts?): ModelHandle;
```

Defined in: [transformers/index.ts:53](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/providers/src/transformers/index.ts#L53)

Self-wiring model handle for a local Transformers.js model: `agent({ model: transformers("…") })`.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `model` | `string` | `DEFAULT_MODEL` | a Hugging Face repo id (default [DEFAULT\_MODEL](/mithril/reference/providers/transformers/variables/default_model/)), e.g. `onnx-community/Qwen3-0.6B-ONNX`. |
| `opts?` | [`TransformersHandleOptions`](/mithril/reference/providers/transformers/interfaces/transformershandleoptions/) | `undefined` | [TransformersHandleOptions](/mithril/reference/providers/transformers/interfaces/transformershandleoptions/) — `onProgress`/`device`/`dtype`, or an injected `engine`. |

## Returns

`ModelHandle`

a ModelHandle bound to the local provider (no registry, no network).

## Example

```ts
import { agent } from "@mithril/core/agent";
import { transformers, preload } from "@mithril/providers/transformers";

await preload("onnx-community/Qwen3-0.6B-ONNX", { onProgress: (p) => setBar(p.progress) });
const a = agent({ model: transformers("onnx-community/Qwen3-0.6B-ONNX"), instructions: "Be brief." });
const r = await a.run("Say hi."); // runs entirely in the browser tab
```
