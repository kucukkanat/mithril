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

Defined in: [packages/core/src/protocol/transport.ts:52](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/transport.ts#L52)

The result of [assertContiguous](/reference/core/protocol/functions/assertcontiguous/): either contiguous, or the first missing `seq`.
