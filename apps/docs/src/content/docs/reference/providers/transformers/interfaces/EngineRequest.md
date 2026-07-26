---
editUrl: false
next: false
prev: false
title: "EngineRequest"
---

Defined in: [transformers/core.ts:13](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/providers/src/transformers/core.ts#L13)

The semantic request handed to a [TransformersEngine](/mithril/reference/providers/transformers/interfaces/transformersengine/) (a flattened ChatRequest).

## Properties

### messages

```ts
readonly messages: readonly Message[];
```

Defined in: [transformers/core.ts:17](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/providers/src/transformers/core.ts#L17)

***

### model

```ts
readonly model: string;
```

Defined in: [transformers/core.ts:15](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/providers/src/transformers/core.ts#L15)

HF repo id (the `transformers/` handle prefix already stripped), e.g. `onnx-community/Qwen3-0.6B-ONNX`.

***

### signal

```ts
readonly signal: AbortSignal;
```

Defined in: [transformers/core.ts:19](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/providers/src/transformers/core.ts#L19)

***

### system

```ts
readonly system: string;
```

Defined in: [transformers/core.ts:16](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/providers/src/transformers/core.ts#L16)

***

### tools

```ts
readonly tools: readonly AnyTool<unknown>[];
```

Defined in: [transformers/core.ts:18](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/providers/src/transformers/core.ts#L18)
