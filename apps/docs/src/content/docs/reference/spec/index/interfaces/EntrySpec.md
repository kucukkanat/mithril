---
editUrl: false
next: false
prev: false
title: "EntrySpec"
---

Defined in: [packages/spec/src/types.ts:141](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L141)

What the generated file executes: `await run(<target>, <input>)`.

## Properties

### initialState?

```ts
readonly optional initialState?: CodeRegion;
```

Defined in: [packages/spec/src/types.ts:146](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L146)

Initial state expression for workflow entries, stored verbatim.

***

### input

```ts
readonly input: 
  | string
  | readonly EntryMessage[];
```

Defined in: [packages/spec/src/types.ts:144](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L144)

***

### target

```ts
readonly target: string;
```

Defined in: [packages/spec/src/types.ts:143](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L143)

Id of an AgentSpec (or, M3+, a WorkflowSpec).
