---
editUrl: false
next: false
prev: false
title: "TransformersHandleOptions"
---

Defined in: [transformers/index.ts:32](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/providers/src/transformers/index.ts#L32)

Options for [transformers](/reference/providers/transformers/functions/transformers/): [EdgeOptions](/reference/providers/transformers/interfaces/edgeoptions/) plus an optional injected engine (tests / custom runtimes).

## Extends

- [`EdgeOptions`](/reference/providers/transformers/interfaces/edgeoptions/)

## Properties

### device?

```ts
readonly optional device?: "webgpu" | "wasm" | "cpu";
```

Defined in: [transformers/edge.ts:23](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/providers/src/transformers/edge.ts#L23)

Force an ONNX execution device; omit to feature-detect: `webgpu` when available, else `cpu` on Node/Bun
(onnxruntime-node rejects `wasm`), else `wasm` in the browser. Pass this explicitly to silence the
Node/Bun CPU-fallback warning.

#### Inherited from

[`EdgeOptions`](/reference/providers/transformers/interfaces/edgeoptions/).[`device`](/reference/providers/transformers/interfaces/edgeoptions/#device)

***

### doSample?

```ts
readonly optional doSample?: boolean;
```

Defined in: [transformers/edge.ts:27](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/providers/src/transformers/edge.ts#L27)

#### Inherited from

[`EdgeOptions`](/reference/providers/transformers/interfaces/edgeoptions/).[`doSample`](/reference/providers/transformers/interfaces/edgeoptions/#dosample)

***

### dtype?

```ts
readonly optional dtype?: string;
```

Defined in: [transformers/edge.ts:25](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/providers/src/transformers/edge.ts#L25)

Force a quantization dtype; omit for `q4f16` (webgpu) / `q4` (cpu/wasm).

#### Inherited from

[`EdgeOptions`](/reference/providers/transformers/interfaces/edgeoptions/).[`dtype`](/reference/providers/transformers/interfaces/edgeoptions/#dtype)

***

### engine?

```ts
readonly optional engine?: TransformersEngine;
```

Defined in: [transformers/index.ts:34](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/providers/src/transformers/index.ts#L34)

Inject a custom [TransformersEngine](/reference/providers/transformers/interfaces/transformersengine/) (a fake for tests, a Web Worker engine, a wllama backend, …).

***

### maxNewTokens?

```ts
readonly optional maxNewTokens?: number;
```

Defined in: [transformers/edge.ts:26](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/providers/src/transformers/edge.ts#L26)

#### Inherited from

[`EdgeOptions`](/reference/providers/transformers/interfaces/edgeoptions/).[`maxNewTokens`](/reference/providers/transformers/interfaces/edgeoptions/#maxnewtokens)

***

### onProgress?

```ts
readonly optional onProgress?: (report) => void;
```

Defined in: [transformers/edge.ts:17](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/providers/src/transformers/edge.ts#L17)

Model-download progress, reported OUTSIDE the event stream (aggregate `loaded/total` across files).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `report` | [`ProgressReport`](/reference/providers/transformers/interfaces/progressreport/) |

#### Returns

`void`

#### Inherited from

[`EdgeOptions`](/reference/providers/transformers/interfaces/edgeoptions/).[`onProgress`](/reference/providers/transformers/interfaces/edgeoptions/#onprogress)
