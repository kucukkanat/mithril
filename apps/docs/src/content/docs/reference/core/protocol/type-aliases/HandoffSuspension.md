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

Defined in: [packages/core/src/protocol/suspension.ts:55](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/suspension.ts#L55)

The delegation built-in: a run suspends because a child (handed-off) run is itself suspended.
