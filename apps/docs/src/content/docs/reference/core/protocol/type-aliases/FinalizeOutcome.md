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

Defined in: [packages/core/src/protocol/middleware.ts:138](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L138)

The outcome of finalizing structured output: a validated `value`, or the schema `issues` that failed.
