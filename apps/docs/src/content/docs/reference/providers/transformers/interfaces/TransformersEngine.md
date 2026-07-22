---
editUrl: false
next: false
prev: false
title: "TransformersEngine"
---

Defined in: [transformers/core.ts:33](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/providers/src/transformers/core.ts#L33)

The injected inference engine — the seam that keeps the provider testable without WebGPU/ONNX.

## Remarks

A browser implementation ([browserEngine](/reference/providers/transformers/functions/browserengine/)) wraps `@huggingface/transformers`; a test injects a
fake that yields scripted [EngineChunk](/reference/providers/transformers/type-aliases/enginechunk/)s. Sentinel stripping + tool-call parsing happen inside the
engine (see `./tool-formats.ts`), so it yields already-parsed tool calls.

## Methods

### generate()

```ts
generate(req): AsyncIterable<EngineChunk>;
```

Defined in: [transformers/core.ts:34](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/providers/src/transformers/core.ts#L34)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `req` | [`EngineRequest`](/reference/providers/transformers/interfaces/enginerequest/) |

#### Returns

`AsyncIterable`\<[`EngineChunk`](/reference/providers/transformers/type-aliases/enginechunk/)\>

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

Defined in: [transformers/core.ts:36](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/providers/src/transformers/core.ts#L36)

Real token counts for the last generation, when the engine can supply them (from tensor dims).

#### Returns

  \| \{
  `inputTokens`: `number`;
  `outputTokens`: `number`;
\}
  \| `undefined`
