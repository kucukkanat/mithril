---
editUrl: false
next: false
prev: false
title: "ProjectSpec"
---

Defined in: [packages/spec/src/types.ts:163](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L163)

A whole serializable project: an ordered list of declarations plus the entry to run.
Statement order in the generated file equals `decls` order, which is what makes
spec→code→spec round-trips lossless.

## Properties

### decls

```ts
readonly decls: readonly ProjectDecl[];
```

Defined in: [packages/spec/src/types.ts:166](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L166)

***

### entry

```ts
readonly entry: EntrySpec;
```

Defined in: [packages/spec/src/types.ts:167](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L167)

***

### meta?

```ts
readonly optional meta?: SpecMeta;
```

Defined in: [packages/spec/src/types.ts:168](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L168)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/spec/src/types.ts:165](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L165)

***

### specVersion

```ts
readonly specVersion: 1;
```

Defined in: [packages/spec/src/types.ts:164](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/spec/src/types.ts#L164)
