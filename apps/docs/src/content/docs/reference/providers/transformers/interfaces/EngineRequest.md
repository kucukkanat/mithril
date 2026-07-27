---
editUrl: false
next: false
prev: false
title: "EngineRequest"
---

Defined in: [transformers/core.ts:13](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/providers/src/transformers/core.ts#L13)

The semantic request handed to a [TransformersEngine](/mithril/reference/providers/transformers/interfaces/transformersengine/) (a flattened ChatRequest).

## Properties

### messages

```ts
readonly messages: readonly Message[];
```

Defined in: [transformers/core.ts:17](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/providers/src/transformers/core.ts#L17)

***

### model

```ts
readonly model: string;
```

Defined in: [transformers/core.ts:15](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/providers/src/transformers/core.ts#L15)

HF repo id (the `transformers/` handle prefix already stripped), e.g. `onnx-community/Qwen3-0.6B-ONNX`.

***

### signal

```ts
readonly signal: AbortSignal;
```

Defined in: [transformers/core.ts:19](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/providers/src/transformers/core.ts#L19)

***

### system

```ts
readonly system: string;
```

Defined in: [transformers/core.ts:16](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/providers/src/transformers/core.ts#L16)

***

### tools

```ts
readonly tools: readonly AnyTool<unknown>[];
```

Defined in: [transformers/core.ts:18](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/providers/src/transformers/core.ts#L18)
