---
editUrl: false
next: false
prev: false
title: "ApprovalRequest"
---

```ts
type ApprovalRequest = SuspensionRequest<"tool.approval", {
  input: JsonValue;
  name: string;
}, ApprovalDecision<JsonValue>>;
```

Defined in: [packages/core/src/protocol/suspension.ts:48](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/protocol/suspension.ts#L48)

The canonical built-in suspension: request human approval of a pending tool call (the 90% HITL case).
