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
  provider: "openai" | "anthropic" | "google" | "groq";
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

Defined in: [packages/spec/src/types.ts:27](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/spec/src/types.ts#L27)

How an agent's `model` is produced in generated code.

## Union Members

### Type Literal

```ts
{
  kind: "live";
  model: string;
  provider: "openai" | "anthropic" | "google" | "groq";
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
