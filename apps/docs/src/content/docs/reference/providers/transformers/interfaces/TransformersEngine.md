---
editUrl: false
next: false
prev: false
title: "TransformersEngine"
---

Defined in: [transformers/core.ts:35](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/providers/src/transformers/core.ts#L35)

The injected inference engine — the seam that keeps the provider testable without WebGPU/ONNX.

## Remarks

A browser implementation ([browserEngine](/mithril/reference/providers/transformers/functions/browserengine/)) wraps `@huggingface/transformers`; a test injects a
fake that yields scripted [EngineChunk](/mithril/reference/providers/transformers/type-aliases/enginechunk/)s. Sentinel stripping + tool-call parsing happen inside the
engine (see `./tool-formats.ts`), so it yields already-parsed tool calls.

## Methods

### generate()

```ts
generate(req): AsyncIterable<EngineChunk>;
```

Defined in: [transformers/core.ts:36](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/providers/src/transformers/core.ts#L36)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `req` | [`EngineRequest`](/mithril/reference/providers/transformers/interfaces/enginerequest/) |

#### Returns

`AsyncIterable`\<[`EngineChunk`](/mithril/reference/providers/transformers/type-aliases/enginechunk/)\>

***

### usage()?

```ts
optional usage(): 
  | {
  inputTokens: number;
  outputTokens: number;
}
  | undefined;
```

Defined in: [transformers/core.ts:38](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/providers/src/transformers/core.ts#L38)

Real token counts for the last generation, when the engine can supply them (from tensor dims).

#### Returns

  \| \{
  `inputTokens`: `number`;
  `outputTokens`: `number`;
\}
  \| `undefined`
