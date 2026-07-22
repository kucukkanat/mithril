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

Defined in: [packages/core/src/protocol/transport.ts:52](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/transport.ts#L52)

The result of [assertContiguous](/reference/core/protocol/functions/assertcontiguous/): either contiguous, or the first missing `seq`.
