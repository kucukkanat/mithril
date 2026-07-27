---
editUrl: false
next: false
prev: false
title: "FinalizeOutcome"
---

```ts
type FinalizeOutcome = 
  | {
  status: "ok";
  value: JsonValue;
}
  | {
  issues: JsonValue;
  status: "invalid";
};
```

Defined in: [packages/core/src/protocol/middleware.ts:138](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/middleware.ts#L138)

The outcome of finalizing structured output: a validated `value`, or the schema `issues` that failed.
