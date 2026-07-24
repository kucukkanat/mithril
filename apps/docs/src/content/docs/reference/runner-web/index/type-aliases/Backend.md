---
editUrl: false
next: false
prev: false
title: "Backend"
---

```ts
type Backend = "webgpu" | "wasm" | "cpu";
```

Defined in: [runner-web/src/catalog.ts:15](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L15)

An ONNX execution backend a local model can run on. Mirrors the transformers provider's `device`
union (defined here too so the catalog stays import-free). `webgpu` is the browser GPU path; `wasm`
is the browser CPU path; `cpu` is onnxruntime-node (Node/Bun, and the eval harness).
