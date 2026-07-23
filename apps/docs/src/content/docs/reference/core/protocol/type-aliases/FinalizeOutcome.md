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

Defined in: [packages/core/src/protocol/middleware.ts:137](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/middleware.ts#L137)

The outcome of finalizing structured output: a validated `value`, or the schema `issues` that failed.
