---
editUrl: false
next: false
prev: false
title: "StepOutcome"
---

Defined in: [packages/core/src/protocol/middleware.ts:119](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/middleware.ts#L119)

The summary of one completed step seen by a [Middleware.step](/mithril/reference/core/protocol/interfaces/middleware/#step) wrapper.

## Remarks

`stop` is how the step ended: `"text"`/`"output"` (a terminal answer), `"tool"` (tool calls ran,
the run continues), `"suspend"` (the step paused for HITL), or `"length"`/`"error"` (terminal). `usage` is
the step's own token delta. `toolOutcomes` lists each tool call's result when `stop` is `"tool"` (empty
otherwise) — the input a retry-budget / loop-detection middleware reads.

## Properties

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/protocol/middleware.ts:120](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/middleware.ts#L120)

***

### stop

```ts
readonly stop: "length" | "error" | "output" | "suspend" | "tool" | "text";
```

Defined in: [packages/core/src/protocol/middleware.ts:121](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/middleware.ts#L121)

***

### toolOutcomes?

```ts
readonly optional toolOutcomes?: readonly ToolStepOutcome[];
```

Defined in: [packages/core/src/protocol/middleware.ts:123](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/middleware.ts#L123)

***

### usage

```ts
readonly usage: UsageDelta;
```

Defined in: [packages/core/src/protocol/middleware.ts:122](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/middleware.ts#L122)
