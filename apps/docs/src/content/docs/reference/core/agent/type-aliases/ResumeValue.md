---
editUrl: false
next: false
prev: false
title: "ResumeValue"
---

```ts
type ResumeValue = 
  | ApprovalDecision<JsonValue>
  | {
  kind: "resolve";
  value: JsonValue;
};
```

Defined in: [packages/core/src/agent/loop.ts:87](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/loop.ts#L87)

The value supplied to resume a suspended run: an approval decision, or an arbitrary resolution value.
