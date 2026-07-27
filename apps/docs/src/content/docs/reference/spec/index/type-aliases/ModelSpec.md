---
editUrl: false
next: false
prev: false
title: "ModelSpec"
---

```ts
type ModelSpec = 
  | {
  kind: "live";
  model: string;
  provider: LiveProviderName;
}
  | {
  dtype?: string;
  kind: "local";
  model: string;
}
  | {
  expr: CodeRegion;
  kind: "code";
};
```

Defined in: [packages/spec/src/types.ts:33](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L33)

How an agent's `model` is produced in generated code.

## Union Members

### Type Literal

```ts
{
  kind: "live";
  model: string;
  provider: LiveProviderName;
}
```

A remote BYOK provider call, e.g. `openai("gpt-4o-mini")`.

***

### Type Literal

```ts
{
  dtype?: string;
  kind: "local";
  model: string;
}
```

An on-device Transformers.js model, e.g. `transformers("onnx-community/Qwen3-0.6B-ONNX")`.

***

### Type Literal

```ts
{
  expr: CodeRegion;
  kind: "code";
}
```

Escape hatch: an arbitrary `ModelInput` expression, stored verbatim.
