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

Defined in: [packages/core/src/protocol/suspension.ts:48](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/suspension.ts#L48)

The canonical built-in suspension: request human approval of a pending tool call (the 90% HITL case).
