---
editUrl: false
next: false
prev: false
title: "EntrySpec"
---

Defined in: packages/spec/src/types.ts:141

What the generated file executes: `await run(<target>, <input>)`.

## Properties

### initialState?

```ts
readonly optional initialState?: CodeRegion;
```

Defined in: packages/spec/src/types.ts:146

Initial state expression for workflow entries, stored verbatim.

***

### input

```ts
readonly input: 
  | string
  | readonly EntryMessage[];
```

Defined in: packages/spec/src/types.ts:144

***

### target

```ts
readonly target: string;
```

Defined in: packages/spec/src/types.ts:143

Id of an AgentSpec (or, M3+, a WorkflowSpec).
