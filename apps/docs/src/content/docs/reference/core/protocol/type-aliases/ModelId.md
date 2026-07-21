---
editUrl: false
next: false
prev: false
title: "ModelId"
---

```ts
type ModelId = `${string}/${string}`;
```

Defined in: packages/core/src/protocol/primitives.ts:40

A `'provider/model'` identifier, e.g. `'anthropic/claude-...'`.

## Remarks

The template only guarantees the `slash` shape; the concrete model is
validated at runtime against the provider spec.
