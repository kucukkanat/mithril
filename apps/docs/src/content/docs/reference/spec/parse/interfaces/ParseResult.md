---
editUrl: false
next: false
prev: false
title: "ParseResult"
---

Defined in: [packages/spec/src/parse.ts:39](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/spec/src/parse.ts#L39)

The outcome of [parseProject](/mithril/reference/spec/parse/functions/parseproject/).

## Properties

### diagnostics

```ts
readonly diagnostics: readonly ParseDiagnostic[];
```

Defined in: [packages/spec/src/parse.ts:42](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/spec/src/parse.ts#L42)

***

### opaqueCount

```ts
readonly opaqueCount: number;
```

Defined in: [packages/spec/src/parse.ts:44](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/spec/src/parse.ts#L44)

How many statements were kept verbatim — surfaced in the UI as "N statements kept as code".

***

### spec

```ts
readonly spec: 
  | ProjectSpec
  | undefined;
```

Defined in: [packages/spec/src/parse.ts:41](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/spec/src/parse.ts#L41)

The recognized spec, or `undefined` when the source has syntax errors or no entry.
