---
editUrl: false
next: false
prev: false
title: "RetryBudgetOptions"
---

Defined in: [packages/core/src/agent/healing.ts:199](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/healing.ts#L199)

Options for [retryBudget](/mithril/reference/core/agent/functions/retrybudget/).

## Properties

### max?

```ts
readonly optional max?: number;
```

Defined in: [packages/core/src/agent/healing.ts:201](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/healing.ts#L201)

Consecutive-failure budget per tool before the run ends with a `TOOL_REPAIR_EXHAUSTED` error. Default 2.
