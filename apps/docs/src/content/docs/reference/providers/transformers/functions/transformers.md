---
editUrl: false
next: false
prev: false
title: "transformers"
---

```ts
function transformers(model?, opts?): ModelHandle;
```

Defined in: [transformers/index.ts:53](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/providers/src/transformers/index.ts#L53)

Self-wiring model handle for a local Transformers.js model: `agent({ model: transformers("…") })`.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `model` | `string` | `DEFAULT_MODEL` | a Hugging Face repo id (default [DEFAULT\_MODEL](/reference/providers/transformers/variables/default_model/)), e.g. `onnx-community/Qwen3-0.6B-ONNX`. |
| `opts?` | [`TransformersHandleOptions`](/reference/providers/transformers/interfaces/transformershandleoptions/) | `undefined` | [TransformersHandleOptions](/reference/providers/transformers/interfaces/transformershandleoptions/) — `onProgress`/`device`/`dtype`, or an injected `engine`. |

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
