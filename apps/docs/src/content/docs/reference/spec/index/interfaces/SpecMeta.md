---
editUrl: false
next: false
prev: false
title: "SpecMeta"
---

Defined in: [packages/spec/src/types.ts:147](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L147)

Studio-only presentation data — codegen ignores it entirely.

## Properties

### layout?

```ts
readonly optional layout?: Readonly<Record<string, {
  x: number;
  y: number;
}>>;
```

Defined in: [packages/spec/src/types.ts:149](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L149)

Canvas node positions, keyed by decl id.
