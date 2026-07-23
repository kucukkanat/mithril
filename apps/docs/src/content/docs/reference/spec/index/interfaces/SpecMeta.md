---
editUrl: false
next: false
prev: false
title: "SpecMeta"
---

Defined in: [packages/spec/src/types.ts:147](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/types.ts#L147)

Studio-only presentation data — codegen ignores it entirely.

## Properties

### layout?

```ts
readonly optional layout?: Readonly<Record<string, {
  x: number;
  y: number;
}>>;
```

Defined in: [packages/spec/src/types.ts:149](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/types.ts#L149)

Canvas node positions, keyed by decl id.
