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

Defined in: [packages/core/src/protocol/transport.ts:52](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/transport.ts#L52)

The result of [assertContiguous](/reference/core/protocol/functions/assertcontiguous/): either contiguous, or the first missing `seq`.
