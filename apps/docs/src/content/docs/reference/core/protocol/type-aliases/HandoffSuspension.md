---
editUrl: false
next: false
prev: false
title: "HandoffSuspension"
---

```ts
type HandoffSuspension = SuspensionRequest<"handoff.suspended", {
  child: SuspensionDescriptor;
  to: string;
}, JsonValue>;
```

Defined in: packages/core/src/protocol/suspension.ts:51

The delegation built-in: a run suspends because a child (handed-off) run is itself suspended.
