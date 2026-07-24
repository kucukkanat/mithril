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

Defined in: [packages/core/src/agent/loop.ts:122](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L122)

The value supplied to resume a suspended run: an approval decision, or an arbitrary resolution value.
