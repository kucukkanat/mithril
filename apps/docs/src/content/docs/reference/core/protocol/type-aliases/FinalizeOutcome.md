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

Defined in: [packages/core/src/protocol/middleware.ts:137](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/middleware.ts#L137)

The outcome of finalizing structured output: a validated `value`, or the schema `issues` that failed.
