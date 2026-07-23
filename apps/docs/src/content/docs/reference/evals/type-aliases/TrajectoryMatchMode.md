---
editUrl: false
next: false
prev: false
title: "TrajectoryMatchMode"
---

```ts
type TrajectoryMatchMode = "strict" | "unordered" | "superset" | "subset";
```

Defined in: trajectory.ts:25

How the ordered list of a run's `tool.call`s is compared against the reference.

## Remarks

- `"strict"` — same calls, same order, 1:1 (no extra, no missing).
- `"unordered"` — the same multiset of calls in any order.
- `"superset"` (default) — the reference is an ordered subsequence of the actual calls; extra calls are
  allowed. The forgiving default: "it did at least these, in this order."
- `"subset"` — every actual call matches some reference step (the run stayed within the allowed set); it
  may do fewer. The restraint check: "it did nothing outside this set."
