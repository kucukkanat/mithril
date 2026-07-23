---
editUrl: false
next: false
prev: false
title: "MatchOptions"
---

Defined in: trajectory.ts:48

Options for [matchesTrajectory](/reference/evals/functions/matchestrajectory/).

## Properties

### mode?

```ts
readonly optional mode?: TrajectoryMatchMode;
```

Defined in: trajectory.ts:50

Sequence-comparison mode (default `"superset"`).

***

### perTool?

```ts
readonly optional perTool?: Readonly<Record<string, (actual, reference) => boolean>>;
```

Defined in: trajectory.ts:54

Per-tool argument comparators, keyed by tool name — override the `toolArgs` mode for those tools.

***

### toolArgs?

```ts
readonly optional toolArgs?: ToolArgsMatchMode;
```

Defined in: trajectory.ts:52

Argument-comparison mode applied to every step (default per-step `"exact"` with input, else `"ignore"`).
