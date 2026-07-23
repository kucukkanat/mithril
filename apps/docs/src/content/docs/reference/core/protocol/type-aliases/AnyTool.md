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
  version?: string;
  execute: unknown;
};
```

Defined in: [packages/core/src/protocol/tool.ts:66](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/protocol/tool.ts#L66)

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

Defined in: [packages/core/src/protocol/tool.ts:68](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/protocol/tool.ts#L68)

***

### examples?

```ts
readonly optional examples?: readonly JsonValue[];
```

Defined in: [packages/core/src/protocol/tool.ts:70](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/protocol/tool.ts#L70)

***

### inputSchema

```ts
readonly inputSchema: StandardSchemaV1<unknown, unknown>;
```

Defined in: [packages/core/src/protocol/tool.ts:71](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/protocol/tool.ts#L71)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/tool.ts:67](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/protocol/tool.ts#L67)

***

### needsApproval?

```ts
readonly optional needsApproval?: boolean | ((input, ctx) => boolean | Promise<boolean>);
```

Defined in: [packages/core/src/protocol/tool.ts:73](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/protocol/tool.ts#L73)

***

### outputSchema?

```ts
readonly optional outputSchema?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: [packages/core/src/protocol/tool.ts:72](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/protocol/tool.ts#L72)

***

### version?

```ts
readonly optional version?: string;
```

Defined in: [packages/core/src/protocol/tool.ts:69](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/protocol/tool.ts#L69)

## Methods

### execute()

```ts
execute(input, ctx): unknown;
```

Defined in: [packages/core/src/protocol/tool.ts:74](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/protocol/tool.ts#L74)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `never` |
| `ctx` | [`RunContext`](/reference/core/protocol/interfaces/runcontext/)\<`Deps`\> |

#### Returns

`unknown`
