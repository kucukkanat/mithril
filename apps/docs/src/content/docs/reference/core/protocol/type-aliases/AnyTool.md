---
editUrl: false
next: false
prev: false
title: "AnyTool"
---

```ts
type AnyTool<Deps> = {
  description: string;
  inputSchema: StandardSchemaV1<unknown, unknown>;
  name: string;
  needsApproval?: boolean | ((input, ctx) => boolean | Promise<boolean>);
  outputSchema?: StandardSchemaV1<unknown, JsonValue>;
  version?: string;
  execute: unknown;
};
```

Defined in: packages/core/src/protocol/tool.ts:61

The variance-correct upper bound for a heterogeneous tuple of tools.

## Remarks

Because `In` is invariant in [Tool](/reference/core/protocol/interfaces/tool/), no single `Tool<string, X, …>` is a
supertype of every concrete tool. This bound is a structural shape using
`never` in input positions (accepts any concrete input contravariantly) and
top types in output positions. Concrete `In`/`Out` survive in a
`const Tools` capture, so [ToolInputOf](/reference/core/protocol/type-aliases/toolinputof/) and [ToolCallFor](/reference/core/protocol/type-aliases/toolcallfor/) stay precise.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | The shared dependency type injected into every tool. |

## Properties

### description

```ts
readonly description: string;
```

Defined in: packages/core/src/protocol/tool.ts:63

***

### inputSchema

```ts
readonly inputSchema: StandardSchemaV1<unknown, unknown>;
```

Defined in: packages/core/src/protocol/tool.ts:65

***

### name

```ts
readonly name: string;
```

Defined in: packages/core/src/protocol/tool.ts:62

***

### needsApproval?

```ts
readonly optional needsApproval?: boolean | ((input, ctx) => boolean | Promise<boolean>);
```

Defined in: packages/core/src/protocol/tool.ts:67

***

### outputSchema?

```ts
readonly optional outputSchema?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: packages/core/src/protocol/tool.ts:66

***

### version?

```ts
readonly optional version?: string;
```

Defined in: packages/core/src/protocol/tool.ts:64

## Methods

### execute()

```ts
execute(input, ctx): unknown;
```

Defined in: packages/core/src/protocol/tool.ts:68

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `never` |
| `ctx` | [`RunContext`](/reference/core/protocol/interfaces/runcontext/)\<`Deps`\> |

#### Returns

`unknown`
