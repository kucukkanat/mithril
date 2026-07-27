---
editUrl: false
next: false
prev: false
title: "EntrySpec"
---

Defined in: [packages/spec/src/types.ts:144](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/types.ts#L144)

What the generated file executes: `await run(<target>, <input>)`.

## Properties

### initialState?

```ts
readonly optional initialState?: CodeRegion;
```

Defined in: [packages/spec/src/types.ts:149](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/types.ts#L149)

Initial state expression for workflow entries, stored verbatim.

***

### input

```ts
readonly input: 
  | string
  | readonly EntryMessage[];
```

Defined in: [packages/spec/src/types.ts:147](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/types.ts#L147)

***

### target

```ts
readonly target: string;
```

Defined in: [packages/spec/src/types.ts:146](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/types.ts#L146)

Id of an AgentSpec (or, M3+, a WorkflowSpec).
