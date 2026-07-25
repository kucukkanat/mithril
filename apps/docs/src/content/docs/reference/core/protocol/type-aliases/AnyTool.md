---
editUrl: false
next: false
prev: false
title: "AnyTool"
---

```ts
type AnyTool<Deps> = {
  description: string;
  examples?: readonly JsonValue[];
  inputSchema: StandardSchemaV1<unknown, unknown>;
  name: string;
  needsApproval?: boolean | ((input, ctx) => boolean | Promise<boolean>);
  outputSchema?: StandardSchemaV1<unknown, JsonValue>;
  timeoutMs?: number;
  version?: string;
  execute: unknown;
};
```

Defined in: [packages/core/src/protocol/tool.ts:78](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/tool.ts#L78)

The variance-correct upper bound for a heterogeneous tuple of tools.

## Remarks

Because `In` is invariant in [Tool](/mithril/reference/core/protocol/interfaces/tool/), no single `Tool<string, X, …>` is a
supertype of every concrete tool. This bound is a structural shape using
`never` in input positions (accepts any concrete input contravariantly) and
top types in output positions. Concrete `In`/`Out` survive in a
`const Tools` capture, so [ToolInputOf](/mithril/reference/core/protocol/type-aliases/toolinputof/) and [ToolCallFor](/mithril/reference/core/protocol/type-aliases/toolcallfor/) stay precise.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | The shared dependency type injected into every tool. |

## Properties

### description

```ts
readonly description: string;
```

Defined in: [packages/core/src/protocol/tool.ts:80](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/tool.ts#L80)

***

### examples?

```ts
readonly optional examples?: readonly JsonValue[];
```

Defined in: [packages/core/src/protocol/tool.ts:82](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/tool.ts#L82)

***

### inputSchema

```ts
readonly inputSchema: StandardSchemaV1<unknown, unknown>;
```

Defined in: [packages/core/src/protocol/tool.ts:83](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/tool.ts#L83)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/tool.ts:79](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/tool.ts#L79)

***

### needsApproval?

```ts
readonly optional needsApproval?: boolean | ((input, ctx) => boolean | Promise<boolean>);
```

Defined in: [packages/core/src/protocol/tool.ts:85](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/tool.ts#L85)

***

### outputSchema?

```ts
readonly optional outputSchema?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: [packages/core/src/protocol/tool.ts:84](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/tool.ts#L84)

***

### timeoutMs?

```ts
readonly optional timeoutMs?: number;
```

Defined in: [packages/core/src/protocol/tool.ts:86](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/tool.ts#L86)

***

### version?

```ts
readonly optional version?: string;
```

Defined in: [packages/core/src/protocol/tool.ts:81](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/tool.ts#L81)

## Methods

### execute()

```ts
execute(input, ctx): unknown;
```

Defined in: [packages/core/src/protocol/tool.ts:87](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/protocol/tool.ts#L87)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `never` |
| `ctx` | [`RunContext`](/mithril/reference/core/protocol/interfaces/runcontext/)\<`Deps`\> |

#### Returns

`unknown`
