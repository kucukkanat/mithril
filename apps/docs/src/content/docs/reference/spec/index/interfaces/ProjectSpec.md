---
editUrl: false
next: false
prev: false
title: "ProjectSpec"
---

Defined in: packages/spec/src/types.ts:190

A whole serializable project: an ordered list of declarations plus the entry to run.
Statement order in the generated file equals `decls` order, which is what makes
spec→code→spec round-trips lossless.

## Properties

### decls

```ts
readonly decls: readonly ProjectDecl[];
```

Defined in: packages/spec/src/types.ts:193

***

### entry

```ts
readonly entry: EntrySpec;
```

Defined in: packages/spec/src/types.ts:194

***

### evals?

```ts
readonly optional evals?: readonly EvalSuiteSpec[];
```

Defined in: packages/spec/src/types.ts:195

***

### meta?

```ts
readonly optional meta?: SpecMeta;
```

Defined in: packages/spec/src/types.ts:196

***

### name

```ts
readonly name: string;
```

Defined in: packages/spec/src/types.ts:192

***

### specVersion

```ts
readonly specVersion: 1;
```

Defined in: packages/spec/src/types.ts:191
