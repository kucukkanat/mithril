---
editUrl: false
next: false
prev: false
title: "EdgeOptions"
---

Defined in: [transformers/edge.ts:15](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/providers/src/transformers/edge.ts#L15)

Options for [browserEngine](/reference/providers/transformers/functions/browserengine/) / [transformers](/reference/providers/transformers/functions/transformers/) / [preload](/reference/providers/transformers/functions/preload/).

## Extended by

- [`TransformersHandleOptions`](/reference/providers/transformers/interfaces/transformershandleoptions/)

## Properties

### device?

```ts
readonly optional device?: "webgpu" | "wasm" | "cpu";
```

Defined in: [transformers/edge.ts:23](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/providers/src/transformers/edge.ts#L23)

Force an ONNX execution device; omit to feature-detect: `webgpu` when available, else `cpu` on Node/Bun
(onnxruntime-node rejects `wasm`), else `wasm` in the browser. Pass this explicitly to silence the
Node/Bun CPU-fallback warning.

***

### doSample?

```ts
readonly optional doSample?: boolean;
```

Defined in: [transformers/edge.ts:27](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/providers/src/transformers/edge.ts#L27)

***

### dtype?

```ts
readonly optional dtype?: string;
```

Defined in: [transformers/edge.ts:25](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/providers/src/transformers/edge.ts#L25)

Force a quantization dtype; omit for `q4f16` (webgpu) / `q4` (cpu/wasm).

***

### maxNewTokens?

```ts
readonly optional maxNewTokens?: number;
```

Defined in: [transformers/edge.ts:26](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/providers/src/transformers/edge.ts#L26)

***

### onProgress?

```ts
readonly optional onProgress?: (report) => void;
```

Defined in: [transformers/edge.ts:17](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/providers/src/transformers/edge.ts#L17)

Model-download progress, reported OUTSIDE the event stream (aggregate `loaded/total` across files).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `report` | [`ProgressReport`](/reference/providers/transformers/interfaces/progressreport/) |

#### Returns

`void`
