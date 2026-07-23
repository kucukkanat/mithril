---
editUrl: false
next: false
prev: false
title: "OpaqueDecl"
---

Defined in: packages/spec/src/types.ts:18

A top-level statement the parser did not recognize as a framework-shaped declaration. Kept
byte-identical (including leading comments) so hand-written code survives round-trips — the
safe default is always "preserve verbatim", never "drop or rewrite".

## Properties

### code

```ts
readonly code: string;
```

Defined in: packages/spec/src/types.ts:23

The full original statement text.

***

### id

```ts
readonly id: string;
```

Defined in: packages/spec/src/types.ts:21

Stable synthetic id (`o1`, `o2`, …) — usable as a canvas node id.

***

### kind

```ts
readonly kind: "opaque";
```

Defined in: packages/spec/src/types.ts:19
