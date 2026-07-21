---
editUrl: false
next: false
prev: false
title: "StepOutcome"
---

Defined in: packages/core/src/protocol/middleware.ts:74

The summary of one completed step seen by a [Middleware.step](/reference/core/protocol/interfaces/middleware/#step) wrapper.

## Remarks

`stop` is how the step ended: `"text"`/`"output"` (a terminal answer), `"tool"` (tool calls ran,
the run continues), `"suspend"` (the step paused for HITL), or `"length"`/`"error"` (terminal). `usage` is
the step's own token delta.

## Properties

### step

```ts
readonly step: number;
```

Defined in: packages/core/src/protocol/middleware.ts:75

***

### stop

```ts
readonly stop: "output" | "length" | "error" | "suspend" | "tool" | "text";
```

Defined in: packages/core/src/protocol/middleware.ts:76

***

### usage

```ts
readonly usage: UsageDelta;
```

Defined in: packages/core/src/protocol/middleware.ts:77
