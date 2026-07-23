---
editUrl: false
next: false
prev: false
title: "ProjectSpec"
---

Defined in: [packages/spec/src/types.ts:166](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L166)

A whole serializable project: an ordered list of declarations plus the entry to run.
Statement order in the generated file equals `decls` order, which is what makes
spec→code→spec round-trips lossless.

## Properties

### decls

```ts
readonly decls: readonly ProjectDecl[];
```

Defined in: [packages/spec/src/types.ts:169](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L169)

***

### entry

```ts
readonly entry: EntrySpec;
```

Defined in: [packages/spec/src/types.ts:170](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L170)

***

### meta?

```ts
readonly optional meta?: SpecMeta;
```

Defined in: [packages/spec/src/types.ts:171](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L171)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/spec/src/types.ts:168](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L168)

***

### specVersion

```ts
readonly specVersion: 1;
```

Defined in: [packages/spec/src/types.ts:167](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L167)
