---
editUrl: false
next: false
prev: false
title: "SpecMeta"
---

Defined in: [packages/spec/src/types.ts:147](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/spec/src/types.ts#L147)

Studio-only presentation data — codegen ignores it entirely.

## Properties

### layout?

```ts
readonly optional layout?: Readonly<Record<string, {
  x: number;
  y: number;
}>>;
```

Defined in: [packages/spec/src/types.ts:149](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/spec/src/types.ts#L149)

Canvas node positions, keyed by decl id.
