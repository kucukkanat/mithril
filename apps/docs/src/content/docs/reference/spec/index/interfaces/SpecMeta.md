---
editUrl: false
next: false
prev: false
title: "SpecMeta"
---

Defined in: packages/spec/src/types.ts:174

Studio-only presentation data — codegen ignores it entirely.

## Properties

### layout?

```ts
readonly optional layout?: Readonly<Record<string, {
  x: number;
  y: number;
}>>;
```

Defined in: packages/spec/src/types.ts:176

Canvas node positions, keyed by decl id.
