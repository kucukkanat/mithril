---
editUrl: false
next: false
prev: false
title: "ContiguityResult"
---

```ts
type ContiguityResult = 
  | {
  ok: true;
}
  | {
  missingFrom: number;
  ok: false;
};
```

Defined in: [packages/core/src/protocol/transport.ts:52](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/transport.ts#L52)

The result of [assertContiguous](/mithril/reference/core/protocol/functions/assertcontiguous/): either contiguous, or the first missing `seq`.
