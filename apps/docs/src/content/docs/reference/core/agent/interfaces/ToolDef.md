---
editUrl: false
next: false
prev: false
title: "ToolDef"
---

Defined in: [packages/core/src/agent/factory.ts:64](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L64)

The definition object passed to [tool](/mithril/reference/core/agent/functions/tool/) to declare a single tool.

## Remarks

- `inputSchema` validates the model-supplied arguments before `execute` runs; invalid input throws
  [MithrilError](/mithril/reference/core/agent/classes/mithrilerror/) `INVALID_TOOL_INPUT`.
- `needsApproval` gates the call behind Tier-1 HITL: a `true` result suspends the run for approval.
- `execute` may return the value directly or be an `AsyncGenerator` that yields [ToolProgress](/mithril/reference/core/protocol/interfaces/toolprogress/)
  before returning the value. It may also return `suspend(...)` to pause the run (Tier-1b), or call
  `ctx.suspend(...)` to pause mid-execution (Tier-2).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Name` *extends* `string` | the tool's literal name (kept `const` so the model call site sees the exact string). |
| `SIn` *extends* [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/) | the input [Standard Schema](https://standardschema.dev); its output type becomes `execute`'s input. |
| `Deps` | the dependency object reachable via `ctx.deps` inside `execute`. |
| `Out` *extends* [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | the tool's JSON-safe return type (constrained to `JsonValue`). |

## Properties

### description

```ts
description: string;
```

Defined in: [packages/core/src/agent/factory.ts:66](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L66)

***

### examples?

```ts
optional examples?: readonly JsonValue[];
```

Defined in: [packages/core/src/agent/factory.ts:69](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L69)

Optional few-shot example inputs, surfaced into the tool's wire description to steer small models.

***

### execute

```ts
execute: (input, ctx) => 
  | Promise<
  | Out
  | Suspend<NoInfer<Out>>>
  | AsyncGenerator<ToolProgress, 
  | Out
| Suspend<NoInfer<Out>>, any>;
```

Defined in: [packages/core/src/agent/factory.ts:78](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L78)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `Infer`\<`SIn`\> |
| `ctx` | [`RunContext`](/mithril/reference/core/protocol/interfaces/runcontext/)\<`Deps`\> |

#### Returns

  \| `Promise`\<
  \| `Out`
  \| [`Suspend`](/mithril/reference/core/protocol/interfaces/suspend/)\<`NoInfer`\<`Out`\>\>\>
  \| `AsyncGenerator`\<[`ToolProgress`](/mithril/reference/core/protocol/interfaces/toolprogress/), 
  \| `Out`
  \| [`Suspend`](/mithril/reference/core/protocol/interfaces/suspend/)\<`NoInfer`\<`Out`\>\>, `any`\>

***

### inputSchema

```ts
inputSchema: SIn;
```

Defined in: [packages/core/src/agent/factory.ts:70](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L70)

***

### name

```ts
name: Name;
```

Defined in: [packages/core/src/agent/factory.ts:65](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L65)

***

### needsApproval?

```ts
optional needsApproval?: boolean | ((input, ctx) => boolean | Promise<boolean>);
```

Defined in: [packages/core/src/agent/factory.ts:72](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L72)

***

### outputSchema?

```ts
optional outputSchema?: StandardSchemaV1<unknown, Out>;
```

Defined in: [packages/core/src/agent/factory.ts:71](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L71)

***

### version?

```ts
optional version?: string;
```

Defined in: [packages/core/src/agent/factory.ts:67](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L67)
