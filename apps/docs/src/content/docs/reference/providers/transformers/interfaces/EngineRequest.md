---
editUrl: false
next: false
prev: false
title: "EngineRequest"
---

Defined in: [transformers/core.ts:12](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/core.ts#L12)

The semantic request handed to a [TransformersEngine](/reference/providers/transformers/interfaces/transformersengine/) (a flattened ChatRequest).

## Properties

### messages

```ts
readonly messages: readonly Message[];
```

Defined in: [transformers/core.ts:16](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/core.ts#L16)

***

### model

```ts
readonly model: string;
```

Defined in: [transformers/core.ts:14](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/core.ts#L14)

HF repo id (the `transformers/` handle prefix already stripped), e.g. `onnx-community/Qwen3-0.6B-ONNX`.

***

### signal

```ts
readonly signal: AbortSignal;
```

Defined in: [transformers/core.ts:18](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/core.ts#L18)

***

### system

```ts
readonly system: string;
```

Defined in: [transformers/core.ts:15](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/core.ts#L15)

***

### tools

```ts
readonly tools: readonly AnyTool<unknown>[];
```

Defined in: [transformers/core.ts:17](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/providers/src/transformers/core.ts#L17)
