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

Defined in: packages/core/src/protocol/transport.ts:52

The result of [assertContiguous](/reference/core/protocol/functions/assertcontiguous/): either contiguous, or the first missing `seq`.
