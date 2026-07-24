---
editUrl: false
next: false
prev: false
title: "ModelId"
---

```ts
type ModelId = `${string}/${string}`;
```

Defined in: [packages/core/src/protocol/primitives.ts:40](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/primitives.ts#L40)

A `'provider/model'` identifier, e.g. `'anthropic/claude-...'`.

## Remarks

The template only guarantees the `slash` shape; the concrete model is
validated at runtime against the provider spec.
