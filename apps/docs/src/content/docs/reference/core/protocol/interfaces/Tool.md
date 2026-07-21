---
editUrl: false
next: false
prev: false
title: "Tool"
---

Defined in: packages/core/src/protocol/tool.ts:27

A typed tool: Standard Schema in/out plus typed dependency injection.

## Remarks

`In`/`Out` are the already-resolved type parameters; the `tool()` factory
recovers them from the schema and `execute` signature. `execute` may return a
promise or an AsyncGenerator that yields [ToolProgress](/reference/core/protocol/interfaces/toolprogress/) and
returns the final output.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Name` *extends* `string` | The tool's literal name. |
| `In` | The validated input type (recovered from `inputSchema`). |
| `Out` | The output type (recovered from `execute`/`outputSchema`). |
| `Deps` | The dependencies injected via [RunContext](/reference/core/protocol/interfaces/runcontext/). |

## Properties

### description

```ts
readonly description: string;
```

Defined in: packages/core/src/protocol/tool.ts:29

***

### inputSchema

```ts
readonly inputSchema: StandardSchemaV1<unknown, In>;
```

Defined in: packages/core/src/protocol/tool.ts:32

***

### name

```ts
readonly name: Name;
```

Defined in: packages/core/src/protocol/tool.ts:28

***

### needsApproval?

```ts
readonly optional needsApproval?: boolean | ((input, ctx) => boolean | Promise<boolean>);
```

Defined in: packages/core/src/protocol/tool.ts:35

Whether the call requires human approval; a predicate can decide per-input.

***

### outputSchema?

```ts
readonly optional outputSchema?: StandardSchemaV1<unknown, JsonSafe<Out>>;
```

Defined in: packages/core/src/protocol/tool.ts:33

***

### version?

```ts
readonly optional version?: string;
```

Defined in: packages/core/src/protocol/tool.ts:31

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

Defined in: packages/core/src/protocol/tool.ts:36

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `In` |
| `ctx` | [`RunContext`](/reference/core/protocol/interfaces/runcontext/)\<`Deps`\> |

#### Returns

  \| `Promise`\<
  \| [`JsonSafe`](/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>
  \| [`Suspend`](/reference/core/protocol/interfaces/suspend/)\<[`JsonSafe`](/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>\>\>
  \| `AsyncGenerator`\<[`ToolProgress`](/reference/core/protocol/interfaces/toolprogress/), 
  \| [`JsonSafe`](/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>
  \| [`Suspend`](/reference/core/protocol/interfaces/suspend/)\<[`JsonSafe`](/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>\>, `any`\>
