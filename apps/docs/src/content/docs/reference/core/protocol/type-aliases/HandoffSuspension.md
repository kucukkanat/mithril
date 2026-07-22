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

Defined in: [packages/core/src/protocol/suspension.ts:55](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/suspension.ts#L55)

The delegation built-in: a run suspends because a child (handed-off) run is itself suspended.
