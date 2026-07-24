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

Defined in: [packages/core/src/protocol/middleware.ts:137](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/middleware.ts#L137)

The outcome of finalizing structured output: a validated `value`, or the schema `issues` that failed.
