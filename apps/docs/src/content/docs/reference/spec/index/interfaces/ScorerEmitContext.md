---
editUrl: false
next: false
prev: false
title: "ScorerEmitContext"
---

Defined in: packages/spec/src/scorers.ts:33

Context passed to [ScorerDescriptor.emit](/reference/spec/index/interfaces/scorerdescriptor/#emit): the emit helpers plus the case's pinned reference (if any).

## Properties

### helpers

```ts
readonly helpers: ScorerEmitHelpers;
```

Defined in: packages/spec/src/scorers.ts:34

***

### reference?

```ts
readonly optional reference?: readonly {
  input?: unknown;
  tool: string;
}[];
```

Defined in: packages/spec/src/scorers.ts:35
