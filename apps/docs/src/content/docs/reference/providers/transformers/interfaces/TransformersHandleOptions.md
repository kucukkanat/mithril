---
editUrl: false
next: false
prev: false
title: "TransformersHandleOptions"
---

Defined in: [transformers/index.ts:32](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/transformers/index.ts#L32)

Options for [transformers](/mithril/reference/providers/transformers/functions/transformers/): [EdgeOptions](/mithril/reference/providers/transformers/interfaces/edgeoptions/) plus an optional injected engine (tests / custom runtimes).

## Extends

- [`EdgeOptions`](/mithril/reference/providers/transformers/interfaces/edgeoptions/)

## Properties

### backends?

```ts
readonly optional backends?: readonly Backend[];
```

Defined in: [transformers/edge.ts:35](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/transformers/edge.ts#L35)

Restrict the Backends this model may run on (fed from the catalog's `LocalModel.backends`). When the
resolved device isn't in this list, loadModel/[preload](/mithril/reference/providers/transformers/functions/preload/) throws an ergonomic `MithrilError`
**before** downloading weights (code `WEBGPU_REQUIRED` for a WebGPU-only model, else `UNSUPPORTED_BACKEND`)
instead of failing with a cryptic mid-stream ONNX kernel error. Omit ⇒ no restriction.

#### Inherited from

[`EdgeOptions`](/mithril/reference/providers/transformers/interfaces/edgeoptions/).[`backends`](/mithril/reference/providers/transformers/interfaces/edgeoptions/#backends)

***

### device?

```ts
readonly optional device?: Backend;
```

Defined in: [transformers/edge.ts:26](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/transformers/edge.ts#L26)

Force an ONNX execution device; omit to feature-detect: `webgpu` when available, else `cpu` on Node/Bun
(onnxruntime-node rejects `wasm`), else `wasm` in the browser. Pass this explicitly to silence the
Node/Bun CPU-fallback warning.

#### Inherited from

[`EdgeOptions`](/mithril/reference/providers/transformers/interfaces/edgeoptions/).[`device`](/mithril/reference/providers/transformers/interfaces/edgeoptions/#device)

***

### doSample?

```ts
readonly optional doSample?: boolean;
```

Defined in: [transformers/edge.ts:37](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/transformers/edge.ts#L37)

#### Inherited from

[`EdgeOptions`](/mithril/reference/providers/transformers/interfaces/edgeoptions/).[`doSample`](/mithril/reference/providers/transformers/interfaces/edgeoptions/#dosample)

***

### dtype?

```ts
readonly optional dtype?: string;
```

Defined in: [transformers/edge.ts:28](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/transformers/edge.ts#L28)

Force a quantization dtype; omit for `q4f16` (webgpu) / `q4` (cpu/wasm).

#### Inherited from

[`EdgeOptions`](/mithril/reference/providers/transformers/interfaces/edgeoptions/).[`dtype`](/mithril/reference/providers/transformers/interfaces/edgeoptions/#dtype)

***

### engine?

```ts
readonly optional engine?: TransformersEngine;
```

Defined in: [transformers/index.ts:34](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/transformers/index.ts#L34)

Inject a custom [TransformersEngine](/mithril/reference/providers/transformers/interfaces/transformersengine/) (a fake for tests, a Web Worker engine, a wllama backend, …).

***

### maxNewTokens?

```ts
readonly optional maxNewTokens?: number;
```

Defined in: [transformers/edge.ts:36](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/transformers/edge.ts#L36)

#### Inherited from

[`EdgeOptions`](/mithril/reference/providers/transformers/interfaces/edgeoptions/).[`maxNewTokens`](/mithril/reference/providers/transformers/interfaces/edgeoptions/#maxnewtokens)

***

### onProgress?

```ts
readonly optional onProgress?: (report) => void;
```

Defined in: [transformers/edge.ts:20](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/providers/src/transformers/edge.ts#L20)

Model-download progress, reported OUTSIDE the event stream (aggregate `loaded/total` across files).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `report` | [`ProgressReport`](/mithril/reference/providers/transformers/interfaces/progressreport/) |

#### Returns

`void`

#### Inherited from

[`EdgeOptions`](/mithril/reference/providers/transformers/interfaces/edgeoptions/).[`onProgress`](/mithril/reference/providers/transformers/interfaces/edgeoptions/#onprogress)
