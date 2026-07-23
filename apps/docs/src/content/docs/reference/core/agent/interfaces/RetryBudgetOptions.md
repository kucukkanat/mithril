---
editUrl: false
next: false
prev: false
title: "RetryBudgetOptions"
---

Defined in: packages/core/src/agent/healing.ts:65

Options for [retryBudget](/reference/core/agent/functions/retrybudget/).

## Properties

### max?

```ts
readonly optional max?: number;
```

Defined in: packages/core/src/agent/healing.ts:67

Consecutive-failure budget per tool before the run ends with a `TOOL_REPAIR_EXHAUSTED` error. Default 2.
