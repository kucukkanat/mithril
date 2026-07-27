---
editUrl: false
next: false
prev: false
title: "SpecMeta"
---

Defined in: [packages/spec/src/types.ts:153](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/types.ts#L153)

Studio-only presentation data — codegen ignores it entirely.

## Properties

### layout?

```ts
readonly optional layout?: Readonly<Record<string, {
  x: number;
  y: number;
}>>;
```

Defined in: [packages/spec/src/types.ts:155](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/types.ts#L155)

Canvas node positions, keyed by decl id.
