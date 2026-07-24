---
editUrl: false
next: false
prev: false
title: "Tool"
---

Defined in: [packages/core/src/protocol/tool.ts:27](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/tool.ts#L27)

A typed tool: Standard Schema in/out plus typed dependency injection.

## Remarks

`In`/`Out` are the already-resolved type parameters; the `tool()` factory
recovers them from the schema and `execute` signature. `execute` may return a
promise or an AsyncGenerator that yields [ToolProgress](/mithril/reference/core/protocol/interfaces/toolprogress/) and
returns the final output.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Name` *extends* `string` | The tool's literal name. |
| `In` | The validated input type (recovered from `inputSchema`). |
| `Out` | The output type (recovered from `execute`/`outputSchema`). |
| `Deps` | The dependencies injected via [RunContext](/mithril/reference/core/protocol/interfaces/runcontext/). |

## Properties

### description

```ts
readonly description: string;
```

Defined in: [packages/core/src/protocol/tool.ts:29](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/tool.ts#L29)

***

### examples?

```ts
readonly optional examples?: readonly JsonValue[];
```

Defined in: [packages/core/src/protocol/tool.ts:36](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/tool.ts#L36)

Optional few-shot example inputs, surfaced into the tool's wire description. A handful of concrete
example calls is the single strongest prompt-side lift for small models' tool-call reliability.

***

### inputSchema

```ts
readonly inputSchema: StandardSchemaV1<unknown, In>;
```

Defined in: [packages/core/src/protocol/tool.ts:37](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/tool.ts#L37)

***

### name

```ts
readonly name: Name;
```

Defined in: [packages/core/src/protocol/tool.ts:28](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/tool.ts#L28)

***

### needsApproval?

```ts
readonly optional needsApproval?: boolean | ((input, ctx) => boolean | Promise<boolean>);
```

Defined in: [packages/core/src/protocol/tool.ts:40](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/tool.ts#L40)

Whether the call requires human approval; a predicate can decide per-input.

***

### outputSchema?

```ts
readonly optional outputSchema?: StandardSchemaV1<unknown, JsonSafe<Out>>;
```

Defined in: [packages/core/src/protocol/tool.ts:38](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/tool.ts#L38)

***

### version?

```ts
readonly optional version?: string;
```

Defined in: [packages/core/src/protocol/tool.ts:31](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/tool.ts#L31)

Optional version, stamped onto `tool.call` and diffed on durable resume for drift.

## Methods

### execute()

```ts
execute(input, ctx): 
  | Promise<
  | JsonSafe<Out>
  | Suspend<JsonSafe<Out>>>
  | AsyncGenerator<ToolProgress, 
  | JsonSafe<Out>
| Suspend<JsonSafe<Out>>, any>;
```

Defined in: [packages/core/src/protocol/tool.ts:41](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/tool.ts#L41)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `In` |
| `ctx` | [`RunContext`](/mithril/reference/core/protocol/interfaces/runcontext/)\<`Deps`\> |

#### Returns

  \| `Promise`\<
  \| [`JsonSafe`](/mithril/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>
  \| [`Suspend`](/mithril/reference/core/protocol/interfaces/suspend/)\<[`JsonSafe`](/mithril/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>\>\>
  \| `AsyncGenerator`\<[`ToolProgress`](/mithril/reference/core/protocol/interfaces/toolprogress/), 
  \| [`JsonSafe`](/mithril/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>
  \| [`Suspend`](/mithril/reference/core/protocol/interfaces/suspend/)\<[`JsonSafe`](/mithril/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>\>, `any`\>
