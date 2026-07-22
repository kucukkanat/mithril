---
editUrl: false
next: false
prev: false
title: "ToolDef"
---

Defined in: [packages/core/src/agent/factory.ts:43](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L43)

The definition object passed to [tool](/reference/core/agent/functions/tool/) to declare a single tool.

## Remarks

- `inputSchema` validates the model-supplied arguments before `execute` runs; invalid input throws
  [MithrilError](/reference/core/agent/classes/mithrilerror/) `INVALID_TOOL_INPUT`.
- `needsApproval` gates the call behind Tier-1 HITL: a `true` result suspends the run for approval.
- `execute` may return the value directly or be an `AsyncGenerator` that yields [ToolProgress](/reference/core/protocol/interfaces/toolprogress/)
  before returning the value. It may also return `suspend(...)` to pause the run (Tier-1b), or call
  `ctx.suspend(...)` to pause mid-execution (Tier-2).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Name` *extends* `string` | the tool's literal name (kept `const` so the model call site sees the exact string). |
| `SIn` *extends* [`StandardSchemaV1`](/reference/core/protocol/interfaces/standardschemav1/) | the input [Standard Schema](https://standardschema.dev); its output type becomes `execute`'s input. |
| `Deps` | the dependency object reachable via `ctx.deps` inside `execute`. |
| `Out` *extends* [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | the tool's JSON-safe return type (constrained to `JsonValue`). |

## Properties

### description

```ts
description: string;
```

Defined in: [packages/core/src/agent/factory.ts:45](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L45)

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

Defined in: [packages/core/src/agent/factory.ts:50](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L50)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `Infer`\<`SIn`\> |
| `ctx` | [`RunContext`](/reference/core/protocol/interfaces/runcontext/)\<`Deps`\> |

#### Returns

  \| `Promise`\<
  \| `Out`
  \| [`Suspend`](/reference/core/protocol/interfaces/suspend/)\<`NoInfer`\<`Out`\>\>\>
  \| `AsyncGenerator`\<[`ToolProgress`](/reference/core/protocol/interfaces/toolprogress/), 
  \| `Out`
  \| [`Suspend`](/reference/core/protocol/interfaces/suspend/)\<`NoInfer`\<`Out`\>\>, `any`\>

***

### inputSchema

```ts
inputSchema: SIn;
```

Defined in: [packages/core/src/agent/factory.ts:47](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L47)

***

### name

```ts
name: Name;
```

Defined in: [packages/core/src/agent/factory.ts:44](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L44)

***

### needsApproval?

```ts
optional needsApproval?: boolean | ((input, ctx) => boolean | Promise<boolean>);
```

Defined in: [packages/core/src/agent/factory.ts:49](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L49)

***

### outputSchema?

```ts
optional outputSchema?: StandardSchemaV1<unknown, Out>;
```

Defined in: [packages/core/src/agent/factory.ts:48](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L48)

***

### version?

```ts
optional version?: string;
```

Defined in: [packages/core/src/agent/factory.ts:46](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L46)
