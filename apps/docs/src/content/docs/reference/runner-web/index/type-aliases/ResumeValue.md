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

Defined in: [core/src/agent/loop.ts:80](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/loop.ts#L80)

The value supplied to resume a suspended run: an approval decision, or an arbitrary resolution value.
