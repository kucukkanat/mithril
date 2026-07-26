---
editUrl: false
next: false
prev: false
title: "RetryBudgetOptions"
---

Defined in: [packages/core/src/agent/healing.ts:199](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/healing.ts#L199)

Options for [retryBudget](/mithril/reference/core/agent/functions/retrybudget/).

## Properties

### max?

```ts
readonly optional max?: number;
```

Defined in: [packages/core/src/agent/healing.ts:201](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/healing.ts#L201)

Consecutive-failure budget per tool before the run ends with a `TOOL_REPAIR_EXHAUSTED` error. Default 2.
