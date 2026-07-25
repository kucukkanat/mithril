---
editUrl: false
next: false
prev: false
title: "Backend"
---

```ts
type Backend = "webgpu" | "wasm" | "cpu";
```

Defined in: [runner-web/src/catalog.ts:15](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/runner-web/src/catalog.ts#L15)

An ONNX execution backend a local model can run on. Mirrors the transformers provider's `device`
union (defined here too so the catalog stays import-free). `webgpu` is the browser GPU path; `wasm`
is the browser CPU path; `cpu` is onnxruntime-node (Node/Bun, and the eval harness).
