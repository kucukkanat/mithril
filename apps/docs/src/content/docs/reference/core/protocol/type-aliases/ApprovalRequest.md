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

Defined in: packages/core/src/protocol/suspension.ts:44

The canonical built-in suspension: request human approval of a pending tool call (the 90% HITL case).
