---
editUrl: false
next: false
prev: false
title: "ParseResult"
---

Defined in: [packages/spec/src/parse.ts:47](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/parse.ts#L47)

The outcome of [parseProject](/mithril/reference/spec/parse/functions/parseproject/).

## Properties

### diagnostics

```ts
readonly diagnostics: readonly ParseDiagnostic[];
```

Defined in: [packages/spec/src/parse.ts:50](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/parse.ts#L50)

***

### opaqueCount

```ts
readonly opaqueCount: number;
```

Defined in: [packages/spec/src/parse.ts:52](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/parse.ts#L52)

How many statements were kept verbatim — surfaced in the UI as "N statements kept as code".

***

### spec

```ts
readonly spec: 
  | ProjectSpec
  | undefined;
```

Defined in: [packages/spec/src/parse.ts:49](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/parse.ts#L49)

The recognized spec, or `undefined` when the source has syntax errors or no entry.
