---
editUrl: false
next: false
prev: false
title: "RetryBudgetOptions"
---

Defined in: [packages/core/src/agent/healing.ts:179](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/healing.ts#L179)

Options for [retryBudget](/reference/core/agent/functions/retrybudget/).

## Properties

### max?

```ts
readonly optional max?: number;
```

Defined in: [packages/core/src/agent/healing.ts:181](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/healing.ts#L181)

Consecutive-failure budget per tool before the run ends with a `TOOL_REPAIR_EXHAUSTED` error. Default 2.
