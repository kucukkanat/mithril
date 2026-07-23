---
editUrl: false
next: false
prev: false
title: "ParseResult"
---

Defined in: [packages/spec/src/parse.ts:39](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/parse.ts#L39)

The outcome of [parseProject](/reference/spec/parse/functions/parseproject/).

## Properties

### diagnostics

```ts
readonly diagnostics: readonly ParseDiagnostic[];
```

Defined in: [packages/spec/src/parse.ts:42](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/parse.ts#L42)

***

### opaqueCount

```ts
readonly opaqueCount: number;
```

Defined in: [packages/spec/src/parse.ts:44](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/parse.ts#L44)

How many statements were kept verbatim — surfaced in the UI as "N statements kept as code".

***

### spec

```ts
readonly spec: 
  | ProjectSpec
  | undefined;
```

Defined in: [packages/spec/src/parse.ts:41](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/spec/src/parse.ts#L41)

The recognized spec, or `undefined` when the source has syntax errors or no entry.
