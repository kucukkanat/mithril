---
editUrl: false
next: false
prev: false
title: "ToolStepOutcome"
---

Defined in: [packages/core/src/protocol/middleware.ts:104](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L104)

A per-tool result summary surfaced on [StepOutcome.toolOutcomes](/mithril/reference/core/protocol/interfaces/stepoutcome/#tooloutcomes), so a step-altitude healing
middleware (retry budgets, loop detection) can inspect what each tool call did without re-deriving it.

## Properties

### callId

```ts
readonly callId: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:105](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L105)

***

### error?

```ts
readonly optional error?: SerializedError;
```

Defined in: [packages/core/src/protocol/middleware.ts:109](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L109)

***

### input

```ts
readonly input: JsonValue;
```

Defined in: [packages/core/src/protocol/middleware.ts:107](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L107)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:106](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L106)

***

### ok

```ts
readonly ok: boolean;
```

Defined in: [packages/core/src/protocol/middleware.ts:108](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/middleware.ts#L108)
