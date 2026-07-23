---
editUrl: false
next: false
prev: false
title: "ParseResult"
---

Defined in: packages/spec/src/parse.ts:39

The outcome of [parseProject](/reference/spec/parse/functions/parseproject/).

## Properties

### diagnostics

```ts
readonly diagnostics: readonly ParseDiagnostic[];
```

Defined in: packages/spec/src/parse.ts:42

***

### opaqueCount

```ts
readonly opaqueCount: number;
```

Defined in: packages/spec/src/parse.ts:44

How many statements were kept verbatim — surfaced in the UI as "N statements kept as code".

***

### spec

```ts
readonly spec: 
  | ProjectSpec
  | undefined;
```

Defined in: packages/spec/src/parse.ts:41

The recognized spec, or `undefined` when the source has syntax errors or no entry.
