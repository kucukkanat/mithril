---
editUrl: false
next: false
prev: false
title: "Materializers"
---

Defined in: materialize.ts:11

Optional hooks for body kinds beyond Tier-1 composition (Tier-2 scripts register through this).

## Indexable

```ts
[kind: string]: ((def) => AnyTool<unknown>) | undefined
```
