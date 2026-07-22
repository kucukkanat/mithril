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

Defined in: [packages/core/src/agent/loop.ts:80](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/agent/loop.ts#L80)

The value supplied to resume a suspended run: an approval decision, or an arbitrary resolution value.
