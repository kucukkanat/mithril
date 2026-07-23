---
editUrl: false
next: false
prev: false
title: "StepOutcome"
---

Defined in: [packages/core/src/protocol/middleware.ts:74](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L74)

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

Defined in: [packages/core/src/protocol/middleware.ts:75](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L75)

***

### stop

```ts
readonly stop: "length" | "error" | "output" | "suspend" | "tool" | "text";
```

Defined in: [packages/core/src/protocol/middleware.ts:76](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L76)

***

### usage

```ts
readonly usage: UsageDelta;
```

Defined in: [packages/core/src/protocol/middleware.ts:77](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L77)
