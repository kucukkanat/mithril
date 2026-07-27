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

Defined in: [packages/core/src/protocol/transport.ts:52](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/transport.ts#L52)

The result of [assertContiguous](/mithril/reference/core/protocol/functions/assertcontiguous/): either contiguous, or the first missing `seq`.
