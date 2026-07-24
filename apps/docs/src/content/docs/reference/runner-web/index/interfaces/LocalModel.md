---
editUrl: false
next: false
prev: false
title: "LocalModel"
---

Defined in: [runner-web/src/catalog.ts:62](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L62)

A curated in-browser model — all `text-generation` ONNX repos. This MUST hold: the transformers
provider loads every model with `AutoModelForCausalLM` (a text-only path), so a vision-language /
`image-text-to-text` repo — even one with an ONNX build — loads but generates garbled output and
never emits tool calls in its trained shape.

## Properties

### backends?

```ts
readonly optional backends?: readonly Backend[];
```

Defined in: [runner-web/src/catalog.ts:86](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L86)

Restrict which ONNX [Backend](/mithril/reference/runner-web/index/type-aliases/backend/)s this model can run on. Omit (the common case) ⇒ portable across
all of [ALL\_BACKENDS](/mithril/reference/runner-web/index/variables/all_backends/). Set it when a model's only published build can't execute everywhere — e.g.
Ternary-Bonsai-8B ships a lone `q2f16` (ternary/1.58-bit) ONNX, and ONNX Runtime's CPU/WASM `MatMulNBits`
kernel has no 2-bit fp16 path, so it runs **only** on WebGPU (`backends: ["webgpu"]`). Consumers use this
to gate the model: the picker disables it when the required backend is unavailable, the eval harness (CPU)
skips it, and the provider throws an ergonomic `WEBGPU_REQUIRED` MithrilError rather than a cryptic
mid-stream ONNX failure. See [requiresWebGPU](/mithril/reference/runner-web/index/functions/requireswebgpu/) / [modelBackends](/mithril/reference/runner-web/index/functions/modelbackends/).

***

### dtype?

```ts
readonly optional dtype?: string;
```

Defined in: [runner-web/src/catalog.ts:76](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L76)

Pin a quantization dtype, overriding the provider's device default (`q4f16` on WebGPU, `q4` on CPU/WASM).
Three reasons a model needs this: (1) fp16 instability — Granite 4.0's Mamba2 layers overflow to NaN under
`q4f16` on WebGPU and emit a stream of `!` (token 0), so its card recommends `q4`; (2) a repo that ships
only one dtype — Qwen3-4B ships `q4f16` only, so the CPU/WASM `q4` default 404s and it must be pinned to
`q4f16`; (3) a repo with no `q4f16` build — Bonsai-1.7B-ONNX ships `q1`/`q2`/`q4`/`q8` (a 1-bit-native
model) but no `q4f16`, so the WebGPU default 404s and it's pinned to the device-portable `q4`. When set,
generated examples AND the preload both use it, so the cached weights match.

***

### id

```ts
readonly id: string;
```

Defined in: [runner-web/src/catalog.ts:63](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L63)

***

### label

```ts
readonly label: string;
```

Defined in: [runner-web/src/catalog.ts:64](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L64)

***

### size

```ts
readonly size: string;
```

Defined in: [runner-web/src/catalog.ts:65](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L65)

***

### tools

```ts
readonly tools: boolean;
```

Defined in: [runner-web/src/catalog.ts:66](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L66)
