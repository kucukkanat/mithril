---
editUrl: false
next: false
prev: false
title: "SpecMeta"
---

Defined in: [packages/spec/src/types.ts:147](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L147)

Studio-only presentation data — codegen ignores it entirely.

## Properties

### layout?

```ts
readonly optional layout?: Readonly<Record<string, {
  x: number;
  y: number;
}>>;
```

Defined in: [packages/spec/src/types.ts:149](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L149)

Canvas node positions, keyed by decl id.
