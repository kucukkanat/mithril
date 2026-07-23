---
editUrl: false
next: false
prev: false
title: "EvalCaseSpec"
---

Defined in: packages/spec/src/types.ts:156

One eval case: an input plus the scorers that judge its trajectory.

## Properties

### input

```ts
readonly input: 
  | string
  | readonly EntryMessage[];
```

Defined in: packages/spec/src/types.ts:158

***

### name

```ts
readonly name: string;
```

Defined in: packages/spec/src/types.ts:157

***

### reference?

```ts
readonly optional reference?: readonly {
  input?: unknown;
  tool: string;
}[];
```

Defined in: packages/spec/src/types.ts:161

A pinned golden reference trajectory (`{ tool, input? }[]`) for `matchesTrajectory`.

***

### scorers

```ts
readonly scorers: readonly ScorerSpec[];
```

Defined in: packages/spec/src/types.ts:159
