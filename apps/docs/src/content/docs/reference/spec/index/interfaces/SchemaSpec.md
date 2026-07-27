---
editUrl: false
next: false
prev: false
title: "SchemaSpec"
---

Defined in: [packages/spec/src/types.ts:47](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L47)

A schema stored as zod SOURCE (e.g. `z.object({ city: z.string() })`), not JSON Schema.
Rationale: core takes any Standard Schema, so zod source is exactly what generated code needs
(codegen is the identity); and zod→JSON-Schema conversion is lossy (`.refine`/`.transform`/
`.describe` chains don't map), which would break the lossless round-trip guarantee.

## Properties

### zod

```ts
readonly zod: string;
```

Defined in: [packages/spec/src/types.ts:48](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L48)
