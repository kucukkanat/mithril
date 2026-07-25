---
editUrl: false
next: false
prev: false
title: "ToolComposition"
---

Defined in: compose.ts:31

The declarative body of a Tier-1 composed tool.

## Properties

### kind

```ts
readonly kind: "composition";
```

Defined in: compose.ts:32

***

### returns?

```ts
readonly optional returns?: ValueRef;
```

Defined in: compose.ts:35

What the composed tool returns; defaults to the last step's output.

***

### steps

```ts
readonly steps: readonly [CompositionStep, CompositionStep];
```

Defined in: compose.ts:33
