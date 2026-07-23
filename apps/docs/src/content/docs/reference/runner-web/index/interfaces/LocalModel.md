---
editUrl: false
next: false
prev: false
title: "LocalModel"
---

Defined in: runner-web/src/catalog.ts:52

A curated in-browser model — all `text-generation` ONNX repos. This MUST hold: the transformers
provider loads every model with `AutoModelForCausalLM` (a text-only path), so a vision-language /
`image-text-to-text` repo — even one with an ONNX build — loads but generates garbled output and
never emits tool calls in its trained shape.

## Properties

### dtype?

```ts
readonly optional dtype?: string;
```

Defined in: runner-web/src/catalog.ts:64

Pin a quantization dtype, overriding the provider's device default (`q4f16` on WebGPU, `q4` on CPU/WASM).
Two reasons a model needs this: (1) fp16 instability — Granite 4.0's Mamba2 layers overflow to NaN under
`q4f16` on WebGPU and emit a stream of `!` (token 0), so its card recommends `q4`; (2) a repo that ships
only one dtype — Qwen3-4B ships `q4f16` only, so the CPU/WASM `q4` default 404s and it must be pinned to
`q4f16`. When set, generated examples AND the preload both use it, so the cached weights match.

***

### id

```ts
readonly id: string;
```

Defined in: runner-web/src/catalog.ts:53

***

### label

```ts
readonly label: string;
```

Defined in: runner-web/src/catalog.ts:54

***

### size

```ts
readonly size: string;
```

Defined in: runner-web/src/catalog.ts:55

***

### tools

```ts
readonly tools: boolean;
```

Defined in: runner-web/src/catalog.ts:56
