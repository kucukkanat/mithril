---
editUrl: false
next: false
prev: false
title: "ParseResult"
---

Defined in: [packages/spec/src/parse.ts:45](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/spec/src/parse.ts#L45)

The outcome of [parseProject](/mithril/reference/spec/parse/functions/parseproject/).

## Properties

### diagnostics

```ts
readonly diagnostics: readonly ParseDiagnostic[];
```

Defined in: [packages/spec/src/parse.ts:48](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/spec/src/parse.ts#L48)

***

### opaqueCount

```ts
readonly opaqueCount: number;
```

Defined in: [packages/spec/src/parse.ts:50](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/spec/src/parse.ts#L50)

How many statements were kept verbatim — surfaced in the UI as "N statements kept as code".

***

### spec

```ts
readonly spec: 
  | ProjectSpec
  | undefined;
```

Defined in: [packages/spec/src/parse.ts:47](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/spec/src/parse.ts#L47)

The recognized spec, or `undefined` when the source has syntax errors or no entry.
