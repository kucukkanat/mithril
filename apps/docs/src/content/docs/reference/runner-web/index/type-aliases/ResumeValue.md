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

Defined in: [core/src/agent/loop.ts:149](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/loop.ts#L149)

The value supplied to resume a suspended run: an approval decision, or an arbitrary resolution value.
