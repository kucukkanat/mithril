---
editUrl: false
next: false
prev: false
title: "RetryBudgetOptions"
---

Defined in: [packages/core/src/agent/healing.ts:179](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/healing.ts#L179)

Options for [retryBudget](/mithril/reference/core/agent/functions/retrybudget/).

## Properties

### max?

```ts
readonly optional max?: number;
```

Defined in: [packages/core/src/agent/healing.ts:181](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/healing.ts#L181)

Consecutive-failure budget per tool before the run ends with a `TOOL_REPAIR_EXHAUSTED` error. Default 2.
