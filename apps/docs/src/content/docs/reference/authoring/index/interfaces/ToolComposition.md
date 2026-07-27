---
editUrl: false
next: false
prev: false
title: "ToolComposition"
---

Defined in: [compose.ts:31](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/compose.ts#L31)

The declarative body of a Tier-1 composed tool.

## Properties

### kind

```ts
readonly kind: "composition";
```

Defined in: [compose.ts:32](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/compose.ts#L32)

***

### returns?

```ts
readonly optional returns?: ValueRef;
```

Defined in: [compose.ts:35](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/compose.ts#L35)

What the composed tool returns; defaults to the last step's output.

***

### steps

```ts
readonly steps: readonly [CompositionStep, CompositionStep];
```

Defined in: [compose.ts:33](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/compose.ts#L33)
