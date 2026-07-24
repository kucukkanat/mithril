---
editUrl: false
next: false
prev: false
title: "SchemaSpec"
---

Defined in: [packages/spec/src/types.ts:41](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L41)

A schema stored as zod SOURCE (e.g. `z.object({ city: z.string() })`), not JSON Schema.
Rationale: core takes any Standard Schema, so zod source is exactly what generated code needs
(codegen is the identity); and zod→JSON-Schema conversion is lossy (`.refine`/`.transform`/
`.describe` chains don't map), which would break the lossless round-trip guarantee.

## Properties

### zod

```ts
readonly zod: string;
```

Defined in: [packages/spec/src/types.ts:42](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L42)
