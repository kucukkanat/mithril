---
editUrl: false
next: false
prev: false
title: "ModelId"
---

```ts
type ModelId = `${string}/${string}`;
```

Defined in: [packages/core/src/protocol/primitives.ts:40](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/primitives.ts#L40)

A `'provider/model'` identifier, e.g. `'anthropic/claude-...'`.

## Remarks

The template only guarantees the `slash` shape; the concrete model is
validated at runtime against the provider spec.
