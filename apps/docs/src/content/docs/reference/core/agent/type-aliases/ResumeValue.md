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

Defined in: packages/core/src/agent/loop.ts:75

The value supplied to resume a suspended run: an approval decision, or an arbitrary resolution value.
