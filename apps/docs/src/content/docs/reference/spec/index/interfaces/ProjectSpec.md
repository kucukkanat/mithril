---
editUrl: false
next: false
prev: false
title: "ProjectSpec"
---

Defined in: [packages/spec/src/types.ts:169](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L169)

A whole serializable project: an ordered list of declarations plus the entry to run.
Statement order in the generated file equals `decls` order, which is what makes
spec→code→spec round-trips lossless.

## Properties

### decls

```ts
readonly decls: readonly ProjectDecl[];
```

Defined in: [packages/spec/src/types.ts:172](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L172)

***

### entry

```ts
readonly entry: EntrySpec;
```

Defined in: [packages/spec/src/types.ts:173](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L173)

***

### meta?

```ts
readonly optional meta?: SpecMeta;
```

Defined in: [packages/spec/src/types.ts:174](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L174)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/spec/src/types.ts:171](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L171)

***

### specVersion

```ts
readonly specVersion: 1;
```

Defined in: [packages/spec/src/types.ts:170](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/types.ts#L170)
