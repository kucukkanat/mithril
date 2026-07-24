---
editUrl: false
next: false
prev: false
title: "EntrySpec"
---

Defined in: [packages/spec/src/types.ts:138](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L138)

What the generated file executes: `await run(<target>, <input>)`.

## Properties

### initialState?

```ts
readonly optional initialState?: CodeRegion;
```

Defined in: [packages/spec/src/types.ts:143](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L143)

Initial state expression for workflow entries, stored verbatim.

***

### input

```ts
readonly input: 
  | string
  | readonly EntryMessage[];
```

Defined in: [packages/spec/src/types.ts:141](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L141)

***

### target

```ts
readonly target: string;
```

Defined in: [packages/spec/src/types.ts:140](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/types.ts#L140)

Id of an AgentSpec (or, M3+, a WorkflowSpec).
