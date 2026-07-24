---
editUrl: false
next: false
prev: false
title: "SelfConsistencyOptions"
---

Defined in: [packages/core/src/agent/test-time.ts:17](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/test-time.ts#L17)

Options for [selfConsistency](/mithril/reference/core/agent/functions/selfconsistency/).

## Properties

### earlyStopAgreement?

```ts
readonly optional earlyStopAgreement?: number;
```

Defined in: [packages/core/src/agent/test-time.ts:21](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/test-time.ts#L21)

Stop early once this many samples agree on the same answer. Omit to always draw all `n`.

***

### n

```ts
readonly n: number;
```

Defined in: [packages/core/src/agent/test-time.ts:19](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/test-time.ts#L19)

How many samples to draw (N). Keep small (≤5) in-browser: samples run sequentially on one device.
