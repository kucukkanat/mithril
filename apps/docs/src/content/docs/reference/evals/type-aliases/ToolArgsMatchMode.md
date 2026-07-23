---
editUrl: false
next: false
prev: false
title: "ToolArgsMatchMode"
---

```ts
type ToolArgsMatchMode = "exact" | "ignore" | "subset" | "superset";
```

Defined in: trajectory.ts:36

How each matched call's `input` is compared against the reference step's `input`.

## Remarks

Per step, the default is `"exact"` when the reference step carries an `input`, else `"ignore"`.
- `"exact"` — deep structural equality.
- `"ignore"` — match on tool name only.
- `"subset"` — the reference `input` is contained in the actual `input` (the call had *at least* these args).
- `"superset"` — the actual `input` is contained in the reference `input` (the call had *no args beyond* these).
