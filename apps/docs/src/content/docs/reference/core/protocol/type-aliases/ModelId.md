---
editUrl: false
next: false
prev: false
title: "ModelId"
---

```ts
type ModelId = `${string}/${string}`;
```

Defined in: [packages/core/src/protocol/primitives.ts:40](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/primitives.ts#L40)

A `'provider/model'` identifier, e.g. `'anthropic/claude-...'`.

## Remarks

The template only guarantees the `slash` shape; the concrete model is
validated at runtime against the provider spec.
